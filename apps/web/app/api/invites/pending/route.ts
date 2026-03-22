import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as da from '../../_lib/data-access';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await da.getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json([], { status: 200 });
    }

    const invites = await da.getPendingInvitesForEmail(user.email);
    return NextResponse.json(invites);
  } catch (err) {
    console.error('GET /api/invites/pending error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
