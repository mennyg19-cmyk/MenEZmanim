import { NextRequest } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { json, error, options } from '../../../_lib/response';
import { store, type MediaItem } from '../../../_lib/store';

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = store.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    return json(store.getOrgMedia(orgId));
  } catch (err) {
    console.error('Media GET error:', err);
    return error('Internal server error', 500);
  }
}

async function uploadToBlob(file: File, uniqueName: string): Promise<string> {
  const { put } = await import('@vercel/blob');
  const blob = await put(uniqueName, file, { access: 'public' });
  return blob.url;
}

async function uploadToLocal(file: File, uniqueName: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadsDir, uniqueName), buffer);
  return `/uploads/${uniqueName}`;
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const resolvedId = store.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || typeof file === 'string') {
      return error('No file provided', 400);
    }

    const ext = path.extname(file.name) || '';
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(ext, '');
    const uniqueName = `${safeName}-${Date.now()}${ext}`;

    const url = useBlob
      ? await uploadToBlob(file, uniqueName)
      : await uploadToLocal(file, uniqueName);

    const item: MediaItem = {
      id: `media-${Date.now()}`,
      orgId: resolvedId,
      url,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    const existing = store.media.get(resolvedId) ?? [];
    existing.push(item);
    store.media.set(resolvedId, existing);

    return json(item, 201);
  } catch (err) {
    console.error('Media POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
