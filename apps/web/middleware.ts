import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isProtectedRoute = createRouteMatcher([
  '/admin(.*)',
  '/api/org(.*)',
  '/api/sync(.*)',
]);

const hasClerk =
  Boolean(process.env.CLERK_SECRET_KEY) &&
  Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export default hasClerk
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
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
