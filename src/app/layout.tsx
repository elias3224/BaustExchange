import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { Suspense } from 'react';
import { TopProgressBar } from '@/components/ui/TopProgressBar';

export const metadata = {
  title: 'BAUST Exchange',
  description:
    'A simple campus marketplace for buying, selling, exchanging and donating useful items.',
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
