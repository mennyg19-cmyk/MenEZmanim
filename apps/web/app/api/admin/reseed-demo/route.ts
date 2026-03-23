import { NextRequest } from 'next/server';
import { json, error, options } from '../../_lib/response';
import { getClerkUserId } from '../../_lib/auth-helpers';
import * as da from '../../_lib/data-access';
import { getDbClient, seedDemoOrganization } from '@zmanim-app/db';

/**
 * POST /api/admin/reseed-demo
 * Re-seeds the demo organization with the latest default layout and data.
 * Super admin only.
 */
export async function POST(_request: NextRequest) {
  try {
    const clerkUserId = await getClerkUserId();
    if (!clerkUserId) return error('Unauthorized', 401);

    const user = await da.getUserByClerkId(clerkUserId);
    if (!user?.isSuperAdmin) return error('Super admin only', 403);

    const db = getDbClient();
    await seedDemoOrganization(db);

    return json({ success: true, message: 'Demo organization re-seeded with latest layout' });
  } catch (err) {
    console.error('Reseed demo error:', err);
    return error('Internal server error', 500);
  }
}

export async function OPTIONS() {
  return options();
}
