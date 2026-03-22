import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    return json(await da.getOrgStyles(orgId));
  } catch (err) {
    console.error('Styles GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const resolvedId = await da.resolveOrgId(orgId);
    if (!resolvedId) return error('Organization not found', 404);

    const body = await request.json();
    const style = await da.createStyle(resolvedId, body);

    return json(style, 201);
  } catch (err) {
    console.error('Styles POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
