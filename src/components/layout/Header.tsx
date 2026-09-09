'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { Bell, Search, User, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { MobileNav } from './MobileNav';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const user = (session?.user || ({} as any));

  useEffect(() => {
    if (user?.id) {
      fetch('/api/notifications?limit=1', { cache: 'no-store' })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setUnread(data?.unreadCount ?? 0))
        .catch(() => setUnread(0));
    }
  }, [session, user?.id]);

  const navLinks = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Marketplace', href: '/marketplace' },
    { label: 'Post Item', href: '/post-item' },
    { label: 'My Listings', href: '/my-listings' },
    { label: 'Requests', href: '/exchange-requests' },
    { label: 'Wanted', href: '/wanted' },
    { label: 'Messages', href: '/messages' },
  ];

  return (
    <header className="h-16 w-full bg-white border-b border-gray-200 flex-shrink-0 shadow-xs z-40 relative">
      <div className="w-full px-4 lg:px-6 flex items-center justify-between h-16 gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-600 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link href="/" className="text-lg font-bold text-brand-700 shrink-0 whitespace-nowrap">
            BAUST Exchange
          </Link>
        </div>

        {status === 'authenticated' && (
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm shrink-0">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="flex items-center gap-3 shrink-0">
          <form action="/marketplace" method="get" className="hidden sm:block relative w-40 md:w-52 focus-within:w-64 transition-all">
            <input
              type="search"
              name="q"
              placeholder="Search items..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>

          {status === 'authenticated' && (
            <Link
              href="/notifications"
              className={`relative p-2 rounded-md text-gray-600 hover:bg-gray-100 shrink-0 transition-colors ${
                pathname === '/notifications' ? 'bg-brand-50 text-brand-700' : ''
              }`}
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center text-xs font-bold leading-none px-1.5 py-0.5 bg-red-500 text-white rounded-full">
                  {unread}
                </span>
              )}
            </Link>
          )}

          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          ) : status === 'authenticated' ? (
            <details className="relative shrink-0">
              <summary className="cursor-pointer flex items-center gap-2 text-sm select-none list-none">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || 'user'} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <User className="w-8 h-8 rounded-full bg-gray-200 p-1 text-gray-600" />
                )}
                <span className="hidden sm:inline-block font-medium text-gray-700 max-w-[120px] truncate">{user?.name || 'User'}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 text-sm z-40">
                <Link href="/profile" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Profile
                </Link>
                <Link href="/settings" className="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                  Settings
                </Link>
                {user?.role === 'admin' && (
                  <Link href="/admin" className="block px-4 py-2 text-purple-700 font-medium hover:bg-purple-50">
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 border-t border-gray-100 mt-1"
                >
                  Logout
                </button>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              className="px-4 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 shrink-0"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 lg:hidden z-40"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 lg:hidden overflow-y-auto z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <span className="font-bold text-brand-700">BAUST Exchange</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                ✕
              </button>
            </div>
            <MobileNav onClose={() => setMobileMenuOpen(false)} />
          </div>
        </>
      )}
    </header>
  );
}
