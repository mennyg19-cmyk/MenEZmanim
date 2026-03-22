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
    if (!user?.isSuperAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const users = await da.getAllUsers();
    return NextResponse.json(users);
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
