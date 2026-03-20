import { NextRequest } from 'next/server';
import path from 'path';
import { unlink } from 'fs/promises';
import { json, error, options } from '../../../../_lib/response';
import { store } from '../../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string; mediaId: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, mediaId } = await ctx.params;
    const resolvedId = store.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const mediaList = store.media.get(resolvedId) ?? [];
    const idx = mediaList.findIndex((m) => m.id === mediaId);
    if (idx === -1) return error('Media not found', 404);

    const item = mediaList[idx];

    if (item.url.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', item.url);
      await unlink(filePath).catch(() => {});
    } else if (item.url.includes('.vercel-storage.com') || item.url.includes('.blob.vercel-storage.com')) {
      const { del } = await import('@vercel/blob');
      await del(item.url).catch(() => {});
    }

    mediaList.splice(idx, 1);
    store.media.set(resolvedId, mediaList);

    return json({ deleted: true });
  } catch (err) {
    console.error('Media DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
