import { NextRequest } from 'next/server';
import { json, error, options } from '../../../../_lib/response';
import * as da from '../../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string; styleId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, styleId } = await ctx.params;
    const style = await da.getStyleById(orgId, styleId);
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
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const resolvedId = await da.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const body = await request.json();
    const updated = await da.updateStyle(resolvedId, styleId, body);
    if (!updated) return error('Style not found', 404);

    return json(updated);
  } catch (err) {
    console.error('Style PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, styleId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;
    const resolvedId = await da.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const ok = await da.deleteStyle(resolvedId, styleId);
    if (!ok) return error('Style not found', 404);

    return json({ deleted: true });
  } catch (err) {
    console.error('Style DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
