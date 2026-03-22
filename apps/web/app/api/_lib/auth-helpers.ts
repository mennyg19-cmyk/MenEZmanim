import { auth } from '@clerk/nextjs/server';
import { error } from './response';
import * as da from './data-access';

const hasClerk =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Authorize a write request against an org.
 * Returns the auth result or a NextResponse error.
 * If Clerk is not configured (local dev), returns a permissive result.
 */
export async function authorizeWrite(
  orgId: string,
  requiredRoles?: string[],
): Promise<da.AuthResult | ReturnType<typeof error>> {
  if (!hasClerk) {
    return { ok: true, userId: 'local', role: 'owner', isSuperAdmin: true };
  }

  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return error('Unauthorized', 401);
  }

  const result = await da.authorizeOrgAccess(clerkUserId, orgId, requiredRoles);
  if (!result.ok) {
    return error(result.message, result.status);
  }

  return result;
}

/**
 * Check if the result is a NextResponse (error) or an AuthResult.
 */
export function isAuthError(result: any): result is ReturnType<typeof error> {
  return result && typeof result === 'object' && 'status' in result && typeof result.json === 'function';
}

/**
 * Get the current user's Clerk ID (or null if not authenticated / Clerk not configured).
 */
export async function getClerkUserId(): Promise<string | null> {
  if (!hasClerk) return null;
  const { userId } = await auth();
  return userId;
}
