import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import * as da from '../../../../_lib/data-access';

type Ctx = { params: Promise<{ orgId: string }> };

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await da.getUserByClerkId(clerkUserId);
    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { orgId } = await ctx.params;
    const body = await request.json();
    const { status } = body;

    if (!['pending', 'active', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updated = await da.updateOrgStatus(orgId, status);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/orgs/[orgId]/status error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
