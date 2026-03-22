import { NextRequest } from 'next/server';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import type { MediaItem } from '../../../_lib/store-types';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    return json(await da.getOrgMedia(orgId));
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

async function writeUploadLocal(buffer: Buffer, uniqueName: string): Promise<string> {
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, uniqueName), buffer);
  return `/uploads/${uniqueName}`;
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const resolvedId = await da.resolveOrgId(orgId);
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

    const buffer = Buffer.from(await file.arrayBuffer());
    const url = useBlob
      ? await uploadToBlob(new File([buffer], file.name, { type: file.type }), uniqueName)
      : await writeUploadLocal(buffer, uniqueName);

    const item: MediaItem = {
      id: `media-${Date.now()}`,
      orgId: resolvedId,
      url,
      filename: file.name,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
    };

    const created = await da.createMediaItem(item, url, buffer.length);
    return json(created, 201);
  } catch (err) {
    console.error('Media POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
