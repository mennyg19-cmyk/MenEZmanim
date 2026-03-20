import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Public GETs for display board + mobile (no login). Writes and export/import require auth.
 */
function isPublicOrgApiRead(req: NextRequest): boolean {
  if (req.method !== 'GET') return false;
  const path = req.nextUrl.pathname;
  if (!path.startsWith('/api/org/')) return false;

  if (/^\/api\/org\/[^/]+\/?$/.test(path)) return true;

  if (
    /^\/api\/org\/[^/]+\/(styles|screens|announcements|memorials|media|schedules|groups)\/?$/.test(path)
  ) {
    return true;
  }

  if (/^\/api\/org\/[^/]+\/(screens|styles|media)\/[^/]+\/?$/.test(path)) {
    return true;
  }

  return false;
}

const hasClerk =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      const path = req.nextUrl.pathname;

      if (path.startsWith('/api/org/')) {
        if (isPublicOrgApiRead(req)) {
          return NextResponse.next();
        }
        await auth.protect();
        return NextResponse.next();
      }

      if (path.startsWith('/api/sync')) {
        await auth.protect();
        return NextResponse.next();
      }

      if (path.startsWith('/admin')) {
        await auth.protect();
        return NextResponse.next();
      }
    })
  : function passthrough() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
