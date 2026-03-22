import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import * as da from '../_lib/data-access';

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let me = await da.getMeData(clerkUserId);

    // If user not found by clerkUserId, try to auto-create/link from Clerk session
    if (!me) {
      try {
        const clerkUser = await currentUser();
        if (clerkUser) {
          const email = clerkUser.emailAddresses.find(
            (e) => e.id === clerkUser.primaryEmailAddressId,
          )?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? '';
          const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || 'User';

          if (email) {
            await da.getOrCreateUser(clerkUserId, email, name);
            me = await da.getMeData(clerkUserId);
          }
        }
      } catch (syncErr) {
        console.error('Auto-sync user failed:', syncErr);
      }
    }

    if (!me) {
      return NextResponse.json({ error: 'User not found in database. Please wait a moment and refresh.' }, { status: 404 });
    }

    return NextResponse.json(me);
  } catch (err) {
    console.error('GET /api/me error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
