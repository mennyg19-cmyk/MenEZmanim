import { NextRequest } from 'next/server';
import { json, error, options } from '../../../_lib/response';
import * as da from '../../../_lib/data-access';
import { authorizeWrite, isAuthError } from '../../../_lib/auth-helpers';

type Ctx = { params: Promise<{ orgId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;

    const invites = await da.getOrgInvites(orgId);
    return json(invites);
  } catch (err) {
    console.error('Invites GET error:', err);
    return error('Internal server error', 500);
  }
}

export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { orgId } = await ctx.params;
    const authResult = await authorizeWrite(orgId, ['owner', 'admin']);
    if (isAuthError(authResult)) return authResult;

    const body = await request.json();
    const { email, role } = body;

    if (!email) return error('Email is required', 400);
    const validRoles = ['admin', 'editor', 'viewer'];
    const inviteRole = validRoles.includes(role) ? role : 'editor';

    const invite = await da.createInvite(orgId, email, inviteRole);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
    const inviteUrl = `${baseUrl}/onboarding?invite=${invite.token}`;

    if (process.env.RESEND_API_KEY) {
      try {
        const orgData = await da.getOrg(orgId);
        const orgName = orgData?.name ?? 'Zmanim App';

        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL ?? 'noreply@zmanim.app',
            to: email,
            subject: `You've been invited to ${orgName}`,
            html: `
              <h2>You've been invited!</h2>
              <p>You've been invited to join <strong>${orgName}</strong> on Zmanim App as a <strong>${inviteRole}</strong>.</p>
              <p><a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Accept Invitation</a></p>
              <p style="color:#6b7280;font-size:12px;">This invitation expires in 7 days.</p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send invite email:', emailErr);
      }
    }

    return json({ ...invite, inviteUrl }, 201);
  } catch (err) {
    console.error('Invites POST error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
