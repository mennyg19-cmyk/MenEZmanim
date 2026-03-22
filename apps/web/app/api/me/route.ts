import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as da from '../_lib/data-access';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const me = await da.getMeData(clerkUserId);
    if (!me) {
      return NextResponse.json({ error: 'User not found in database. Please wait a moment and refresh.' }, { status: 404 });
    }

    return NextResponse.json(me);
  } catch (err) {
    console.error('GET /api/me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
