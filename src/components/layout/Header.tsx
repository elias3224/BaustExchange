'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useState, useRef, useEffect } from 'react';
import { Search, User, Menu, X } from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { MobileNav } from './MobileNav';

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const user = (session?.user || ({} as any));

  // Lock body scroll when mobile off-canvas drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Click & Touch outside to close profile dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent | TouchEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [profileOpen]);

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
      <div className="w-full px-3 sm:px-4 lg:px-6 flex items-center justify-between h-16 gap-2 sm:gap-4">
        {/* Left Side: Hamburger (Mobile) + Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 active:bg-gray-200 focus:outline-none transition-colors"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>

          <Link href="/dashboard" className="text-base sm:text-lg font-bold text-brand-700 shrink-0 whitespace-nowrap">
            BAUST <span className="text-brand-600">Exchange</span>
          </Link>
        </div>

        {/* Desktop Navbar Links */}
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

        {/* Right Side: Search + Notifications + Profile Avatar */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Desktop Search Bar */}
          <form action="/marketplace" method="get" className="hidden sm:block relative w-36 md:w-52 focus-within:w-64 transition-all">
            <input
              type="search"
              name="q"
              placeholder="Search items..."
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </form>

          {/* Notifications */}
          {status === 'authenticated' && <NotificationBell />}

          {/* User Profile Avatar / Dropdown */}
          {status === 'loading' ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
          ) : status === 'authenticated' ? (
            <div className="relative shrink-0" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((prev) => !prev)}
                className="flex items-center gap-2 text-sm select-none focus:outline-none rounded-full p-0.5 hover:ring-2 hover:ring-brand-500/40 transition-all"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || 'user'} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
                ) : (
                  <User className="w-8 h-8 rounded-full bg-gray-200 p-1 text-gray-600" />
                )}
                <span className="hidden sm:inline-block font-medium text-gray-700 max-w-[100px] md:max-w-[140px] truncate">
                  {user?.name || 'User'}
                </span>
              </button>

              {/* Controlled Responsive Dropdown Popup */}
              {profileOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 max-w-[calc(100vw-1.5rem)] bg-white border border-gray-200 rounded-xl shadow-xl py-1 text-sm z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                    <p className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    role="menuitem"
                  >
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="block px-4 py-2 text-gray-700 hover:bg-gray-50 active:bg-gray-100"
                    role="menuitem"
                  >
                    Settings
                  </Link>

                  {user?.role === 'admin' && (
                    <Link
                      href="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="block px-4 py-2 text-purple-700 font-semibold hover:bg-purple-50 active:bg-purple-100"
                      role="menuitem"
                    >
                      Admin Panel
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setProfileOpen(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 active:bg-red-100 border-t border-gray-100 font-medium"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:bg-brand-700 shrink-0 shadow-xs"
            >
              Login
            </Link>
          )}
        </div>
      </div>

      {/* Off-Canvas Mobile Drawer Sidebar Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs lg:hidden z-50 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[82vw] bg-white border-r border-gray-200 lg:hidden z-50 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 shrink-0">
              <span className="font-bold text-brand-700 text-base">BAUST Exchange</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MobileNav onClose={() => setMobileMenuOpen(false)} />
            </div>
          </div>
        </>
      )}
    </header>
  );
}
