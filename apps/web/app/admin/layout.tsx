'use client';

import { SignedIn, SignedOut, RedirectToSignIn } from '@clerk/nextjs';

const hasClerk =
  typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 0;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasClerk) {
    return <>{children}</>;
  }

  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
}
