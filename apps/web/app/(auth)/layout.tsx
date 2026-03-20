import type { Metadata } from 'next';

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
