import { NextRequest } from 'next/server';
import { json, error, options } from '../../../../_lib/response';
import * as da from '../../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string; membershipId: string }> };

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId, membershipId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;

    try {
      await da.removeOrgMember(orgId, membershipId);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Failed to remove member';
      return error(msg, 400);
    }
    return json({ ok: true });
  } catch (err) {
    console.error('Member DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
