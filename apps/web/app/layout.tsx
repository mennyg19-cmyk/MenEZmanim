import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';

const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const metadata: Metadata = {
  title: 'Zmanim App',
};

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?display=swap' +
  '&family=Heebo:wght@300;400;500;600;700;800;900' +
  '&family=Rubik:wght@300;400;500;600;700' +
  '&family=Assistant:wght@300;400;600;700' +
  '&family=Open+Sans:wght@300;400;600;700' +
  '&family=Inter:wght@300;400;500;600;700' +
  '&family=Noto+Sans+Hebrew:wght@300;400;500;600;700' +
  '&family=Noto+Serif+Hebrew:wght@400;500;700' +
  '&family=Frank+Ruhl+Libre:wght@300;400;500;700' +
  '&family=David+Libre:wght@400;500;700' +
  '&family=Playfair+Display:wght@400;600;700' +
  '&family=Merriweather:wght@300;400;700' +
  '&family=Secular+One' +
  '&family=Varela+Round' +
  '&family=Alef:wght@400;700' +
  '&family=Suez+One' +
  '&family=Amatic+SC:wght@400;700' +
  '&family=Oswald:wght@300;400;500;600;700' +
  '&family=Montserrat:wght@300;400;500;600;700' +
  '&family=Poppins:wght@300;400;500;600;700' +
  '&family=Raleway:wght@300;400;500;600;700' +
  '&family=Arimo:wght@400;500;600;700' +
  '&family=Karantina:wght@300;400;700' +
  '&family=Bellefair' +
  '&family=Tinos:wght@400;700';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href={GOOGLE_FONTS_URL} rel="stylesheet" />
      </head>
      <body style={{ fontFamily: "'Heebo', system-ui, -apple-system, 'Segoe UI', Arial, sans-serif" }}>
        {clerkPublishableKey ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>{children}</ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
