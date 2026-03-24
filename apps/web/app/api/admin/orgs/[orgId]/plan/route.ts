import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import * as da from '../../../../_lib/data-access';
import { normalizeOrgPlan, type OrgPlan } from '@zmanim-app/core';

type Ctx = { params: Promise<{ orgId: string }> };

const VALID: OrgPlan[] = ['free', 'basic', 'pro', 'enterprise'];

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
    const plan = typeof body.plan === 'string' ? normalizeOrgPlan(body.plan) : null;
    if (!plan || !VALID.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const updated = await da.updateOrgPlan(orgId, plan);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/admin/orgs/[orgId]/plan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
