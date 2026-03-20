import { NextRequest } from 'next/server';
import path from 'path';
import { unlink } from 'fs/promises';
import { json, error, options } from '../../../../_lib/response';
import * as da from '../../../../_lib/data-access';

type Ctx = { params: Promise<{ orgId: string; mediaId: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, mediaId } = await ctx.params;
    const resolvedId = await da.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const result = await da.deleteMediaItem(resolvedId, mediaId);
    if (!result.ok) return error('Media not found', 404);

    const stored = result.filePath;
    const itemUrl =
      stored.startsWith('http') || stored.startsWith('/') ? stored : `/uploads/${path.basename(stored)}`;

    if (itemUrl.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', itemUrl);
      await unlink(filePath).catch(() => {});
    } else if (itemUrl.includes('.vercel-storage.com') || itemUrl.includes('.blob.vercel-storage.com')) {
      const { del } = await import('@vercel/blob');
      await del(itemUrl).catch(() => {});
    }

    return json({ deleted: true });
  } catch (err) {
    console.error('Media DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
