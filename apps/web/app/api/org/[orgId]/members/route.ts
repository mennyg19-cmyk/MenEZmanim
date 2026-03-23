import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;

    const members = await da.getOrgMembers(orgId);
    return json(members);
  } catch (err) {
    console.error('Members GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
