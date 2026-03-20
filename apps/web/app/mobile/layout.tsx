import type { Metadata, Viewport } from 'next';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Zmanim App - Mobile',
};

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
