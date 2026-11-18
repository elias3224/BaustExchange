import type { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';

export const metadata: Metadata = {
  title: 'BAUST Exchange',
  description:
    'A simple campus marketplace for buying, selling, exchanging and donating useful items.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Suspense fallback={null}>
            <TopProgressBar />
          </Suspense>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
