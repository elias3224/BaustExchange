import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightSidebar } from '@/components/layout/RightSidebar';
import { SessionProviderInner } from '@/components/ui/SessionContext';
import { SessionProvider } from 'next-auth/react';

/**
 * Layout for the authenticated area of the app.
 *
 * Viewport-Fixed 3-column shell:
 * - Header: Fixed top navbar (fixed top-0 left-0 right-0 h-16 z-40)
 * - Sidebar: Fixed left panel (fixed top-16 left-0 260px z-30, 100% stationary)
 * - RightSidebar: Fixed right panel (fixed top-16 right-0 310px z-30)
 * - Main: Content container with pt-16 offset and lg:pl-[260px] xl:pr-[310px]
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth().catch(() => null);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = session.user as any;
  if (user.status === 'blocked') {
    redirect('/auth/logout');
  }

  return (
    <SessionProvider session={session}>
      <SessionProviderInner user={session.user}>
        <div className="h-screen w-screen flex flex-col overflow-hidden bg-gray-50">
          <Header />
          <div className="flex-1 flex min-h-0 overflow-hidden w-full relative">
            <Sidebar />
            <div className="flex-1 h-full overflow-y-auto min-w-0">
              <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">{children}</main>
            </div>
            <RightSidebar />
          </div>
        </div>
      </SessionProviderInner>
    </SessionProvider>
  );
}
