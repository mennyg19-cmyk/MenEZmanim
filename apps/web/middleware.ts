import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * If sign-in URLs are misconfigured as /show/login/..., Clerk OAuth lands on
 * /show/login/sso-callback which matches the DISPLAY route /show/[org]/[screen]
 * (org=login, screen=sso-callback) and shows "Display Error" + API 404.
 * Real auth lives at /login/* only.
 */
function redirectIfShowAuthConfusion(req: NextRequest): NextResponse | null {
  const path = req.nextUrl.pathname;
  if (path.startsWith('/show/login')) {
    const rest = path.slice('/show/login'.length);
    const url = req.nextUrl.clone();
    url.pathname = `/login${rest}`;
    return NextResponse.redirect(url);
  }
  if (path.startsWith('/show/register')) {
    const rest = path.slice('/show/register'.length);
    const url = req.nextUrl.clone();
    url.pathname = `/register${rest}`;
    return NextResponse.redirect(url);
  }
  return null;
}

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
      const confused = redirectIfShowAuthConfusion(req);
      if (confused) return confused;

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

      // Public pages (/login, /register, /, /show/..., /mobile, …) must return next — otherwise the
      // middleware resolves to undefined and Vercel/Next can respond with 404.
      return NextResponse.next();
    })
  : function passthrough(req: NextRequest) {
      const confused = redirectIfShowAuthConfusion(req);
      if (confused) return confused;
      return NextResponse.next();
    };

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
