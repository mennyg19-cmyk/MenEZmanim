import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const status = await da.getEditLockStatus(orgId);
    return json(status);
  } catch (err) {
    console.error('Lock GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const auth = authResult as da.AuthResult & { ok: true };

    const result = await da.acquireEditLock(orgId, auth.userId);
    if (!result.ok) {
      return json({ locked: true, lockedBy: result.lockedBy }, 423);
    }
    return json({ locked: false, acquired: true });
  } catch (err) {
    console.error('Lock POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function PUT(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const auth = authResult as da.AuthResult & { ok: true };

    const ok = await da.renewEditLock(orgId, auth.userId);
    if (!ok) return error('No active lock found', 404);
    return json({ renewed: true });
  } catch (err) {
    console.error('Lock PUT error:', err);
    return error('Internal server error', 500);
  }
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId);
    if (isAuthError(authResult)) return authResult;
    const auth = authResult as da.AuthResult & { ok: true };

    await da.releaseEditLock(orgId, auth.userId);
    return json({ released: true });
  } catch (err) {
    console.error('Lock DELETE error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
