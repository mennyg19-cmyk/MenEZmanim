import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import * as da from '../../_lib/data-access';

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_request: NextRequest, ctx: Ctx) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { token } = await ctx.params;
    const result = await da.acceptInvite(token, clerkUserId);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('POST /api/invites/[token] error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 400 });
  }
}
