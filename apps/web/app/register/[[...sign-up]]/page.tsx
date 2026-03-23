'use client';

import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!pk) {
    return (
      <main className="web-authShell min-h-screen p-6">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-2xl">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Clerk not configured</h1>
          <p className="text-slate-600 text-sm leading-relaxed">
            Copy <code className="rounded bg-slate-100 px-1">apps/web/.env.example</code> to{' '}
            <code className="rounded bg-slate-100 px-1">.env.local</code> and add your keys from{' '}
            <a href="https://dashboard.clerk.com" className="text-sky-600 underline">
              dashboard.clerk.com
            </a>
            .
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="web-authShell min-h-screen p-4">
      <div className="w-full max-w-md flex justify-center">
        <SignUp
          signInUrl="/login"
          fallbackRedirectUrl="/admin"
          forceRedirectUrl="/admin"
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-2xl',
            },
          }}
        />
      </div>
    </main>
  );
}
