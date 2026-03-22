import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;
    const org = await da.getOrg(orgId);
    if (!org) return error('Organization not found', 404);

    const body = await request.json();
    const sourcePath = body.sourcePath;

    if (!sourcePath) {
      return error('sourcePath is required', 400);
    }

    return json({
      success: true,
      orgId,
      sourcePath,
      message: `BeeZee import from "${sourcePath}" would be processed here. This is a placeholder — the actual import logic requires file-system access and database writes.`,
      imported: {
        schedules: 0,
        memorials: 0,
        announcements: 0,
      },
    });
  } catch (err) {
    console.error('Import POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
