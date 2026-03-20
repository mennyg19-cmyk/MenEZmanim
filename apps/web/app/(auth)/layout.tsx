import type { Metadata } from 'next';

/** Avoid static/edge caching of auth routes (Vercel logs showed /login 404 + cache HIT). */
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Zmanim App - Login',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
