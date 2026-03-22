import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import * as da from '../_lib/data-access';

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await da.getUserByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'create-org') {
      const { name, slug, latitude, longitude, timezone, elevation, inIsrael } = body;
      if (!name || !slug || latitude == null || longitude == null || !timezone) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
      }

      const org = await da.createOrganization(
        { name, slug: slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'), latitude, longitude, timezone, elevation, inIsrael },
        user.id,
      );
      return NextResponse.json({ orgId: org.id, status: org.status });
    }

    if (action === 'accept-invite') {
      const { token } = body;
      if (!token) {
        return NextResponse.json({ error: 'Missing invite token' }, { status: 400 });
      }
      const result = await da.acceptInvite(token, clerkUserId);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    console.error('Onboarding error:', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}
