import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { getDbClient } from '@zmanim-app/db';

interface ClerkEmailAddress {
  email_address: string;
  id: string;
}

interface ClerkUserEvent {
  data: {
    id: string;
    email_addresses: ClerkEmailAddress[];
    primary_email_address_id: string;
    first_name: string | null;
    last_name: string | null;
  };
  type: string;
}

export async function POST(request: NextRequest) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    console.error('CLERK_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const body = await request.text();

  let event: ClerkUserEvent;
  try {
    const wh = new Webhook(secret);
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as ClerkUserEvent;
  } catch (err) {
    console.error('Webhook verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const { type, data } = event;

  if (type === 'user.created' || type === 'user.updated') {
    const clerkUserId = data.id;
    const primaryEmail = data.email_addresses.find(
      (e) => e.id === data.primary_email_address_id,
    );
    const email = primaryEmail?.email_address ?? data.email_addresses[0]?.email_address ?? '';
    const name = [data.first_name, data.last_name].filter(Boolean).join(' ') || 'User';

    const db = getDbClient();

    // Check if a pre-seeded user exists by email (e.g. super admin seed with placeholder clerkUserId)
    const existingByEmail = await db.user.findUnique({ where: { email } });
    if (existingByEmail && existingByEmail.clerkUserId !== clerkUserId) {
      await db.user.update({
        where: { id: existingByEmail.id },
        data: { clerkUserId, name },
      });
    } else {
      await db.user.upsert({
        where: { clerkUserId },
        create: { clerkUserId, email, name },
        update: { email, name },
      });
    }
  }

  return NextResponse.json({ received: true });
}
