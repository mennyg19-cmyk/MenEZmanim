import { NextRequest } from 'next/server';
import { json, error, options } from '../../../../_lib/response';
import { store } from '../../../../_lib/store';

type Ctx = { params: Promise<{ orgId: string; styleId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, styleId } = await ctx.params;
    const styles = store.getOrgStyles(orgId);
    const style = styles.find((s) => s.id === styleId);
    if (!style) return error('Style not found', 404);
    return json(style);
  } catch (err) {
    console.error('Style GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, styleId } = await ctx.params;
    const resolvedId = store.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const styles = store.getOrgStyles(orgId);
    const idx = styles.findIndex((s) => s.id === styleId);
    if (idx === -1) return error('Style not found', 404);

    const body = await request.json();
    styles[idx] = { ...styles[idx], ...body, id: styleId };
    store.styles.set(resolvedId, styles);

    return json(styles[idx]);
  } catch (err) {
    console.error('Style PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, styleId } = await ctx.params;
    const resolvedId = store.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const styles = store.getOrgStyles(orgId);
    const idx = styles.findIndex((s) => s.id === styleId);
    if (idx === -1) return error('Style not found', 404);

    styles.splice(idx, 1);
    store.styles.set(resolvedId, styles);

    return json({ deleted: true });
  } catch (err) {
    console.error('Style DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
