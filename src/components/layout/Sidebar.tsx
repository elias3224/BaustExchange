'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Plus,
  List,
  RefreshCw,
  Mail,
  Heart,
  Bell,
  User,
  Settings,
  LogOut,
  Shield,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useSessionUser } from '@/components/ui/SessionContext';
import { LogoutModal } from './LogoutModal';

const NAV = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Post Item', href: '/post-item', icon: Plus },
  { label: 'Campus PRO & Boost', href: '/upgrade', icon: Sparkles },
  { label: 'My Listings', href: '/my-listings', icon: List },
  { label: 'Exchange Requests', href: '/exchange-requests', icon: RefreshCw },
  { label: 'Messages', href: '/messages', icon: Mail },
  { label: 'Wanted Items', href: '/wanted', icon: Heart },
  { label: 'Notifications', href: '/notifications', icon: Bell },
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Logout', href: '/auth/logout', icon: LogOut },
];

const CATEGORY_ITEMS = [
  { label: 'All Items', href: '/marketplace' },
  { label: 'Books', href: '/marketplace?category=Books' },
  { label: 'Furniture', href: '/marketplace?category=Furniture' },
  { label: 'Electronics', href: '/marketplace?category=Electronics' },
  { label: 'Clothing', href: '/marketplace?category=Clothing' },
  { label: 'Stationery', href: '/marketplace?category=Stationery' },
  { label: 'Academic Materials', href: '/marketplace?category=Academic%20Materials' },
  { label: 'Sports', href: '/marketplace?category=Sports' },
  { label: 'Others', href: '/marketplace?category=Others' },
];

export function Sidebar() {
  const user = useSessionUser();
  const pathname = usePathname();

  // Left sidebar collapse/expand state
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Unread messages count state
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Load persisted collapse state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('left_sidebar_collapsed');
      if (saved !== null) {
        setIsCollapsed(JSON.parse(saved));
      }
    } catch {
      // fallback
    }
  }, []);

  // Fetch unread messages count & poll periodically
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/messages/unread-count', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (typeof data.unreadCount === 'number') {
            setUnreadCount(data.unreadCount);
          }
        }
      } catch (err) {
        // quiet error
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, []);

  // Listen to instantaneous unread count sync events (e.g. from MessagesClient)
  useEffect(() => {
    const handleCountSync = (e: Event) => {
      const customEvent = e as CustomEvent<{ count: number }>;
      if (typeof customEvent.detail?.count === 'number') {
        setUnreadCount(customEvent.detail.count);
      }
    };

    window.addEventListener('baust:unread-messages-count', handleCountSync);
    return () => window.removeEventListener('baust:unread-messages-count', handleCountSync);
  }, []);

  function toggleSidebar() {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('left_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <aside
      className={`hidden lg:flex flex-col flex-shrink-0 h-full border-r border-gray-200 bg-white select-none overflow-hidden transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-[68px]' : 'w-[260px]'
      }`}
    >
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        {/* Navigation Section */}
        <div>
          {isCollapsed ? (
            <div className="flex justify-center pb-2 pt-0.5 border-b border-gray-100 mb-2">
              <button
                type="button"
                onClick={toggleSidebar}
                title="Expand Left Sidebar"
                aria-label="Expand Left Sidebar"
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-brand-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-brand-600" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-3 pb-1.5 pt-0.5 border-b border-gray-100 mb-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                Navigation
              </span>
              <button
                type="button"
                onClick={toggleSidebar}
                title="Collapse Left Sidebar"
                aria-label="Collapse Left Sidebar"
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {NAV.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && item.href !== '/dashboard' && pathname?.startsWith(item.href));
              const isMessages = item.href === '/messages';

              if (item.label === 'Logout') {
                return isCollapsed ? (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    title="Logout"
                    className="relative flex items-center justify-center p-2 rounded-md transition-colors text-red-600 hover:bg-red-50 w-full"
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-red-600" />
                  </button>
                ) : (
                  <button
                    key={item.href}
                    type="button"
                    onClick={() => setShowLogoutModal(true)}
                    className="flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-50 w-full text-left"
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-red-600" />
                    <span className="truncate flex-1">Logout</span>
                  </button>
                );
              }

              if (isCollapsed) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={item.label}
                    className={`relative flex items-center justify-center p-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <item.icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-brand-600' : 'text-gray-500'
                        }`}
                      />
                      {isMessages && unreadCount > 0 && (
                        <span
                          aria-label={`${unreadCount} unread messages`}
                          className="absolute -top-1.5 -right-2.5 inline-flex items-center justify-center px-1 text-[9px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[15px] h-[15px] shadow-xs"
                        >
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-brand-600' : 'text-gray-500'
                    }`}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {isMessages && unreadCount > 0 && (
                    <span
                      aria-label={`${unreadCount} unread messages`}
                      className="ml-auto inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-600 rounded-full min-w-[18px] h-[18px] shadow-xs shrink-0"
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            {user?.role === 'admin' && (
              isCollapsed ? (
                <>
                  <Link
                    href="/admin"
                    title="Admin Panel"
                    className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                      pathname === '/admin'
                        ? 'bg-purple-100 text-purple-800 font-semibold'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0 text-purple-600" />
                  </Link>
                  <Link
                    href="/admin/pro-users"
                    title="PRO User Management"
                    className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                      pathname?.startsWith('/admin/pro-users')
                        ? 'bg-amber-100 text-amber-800 font-semibold'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/admin"
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                      pathname === '/admin'
                        ? 'bg-purple-100 text-purple-800 font-semibold'
                        : 'text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <Shield className="w-4 h-4 shrink-0 text-purple-600" />
                    <span className="truncate">Admin Panel</span>
                  </Link>
                  <Link
                    href="/admin/pro-users"
                    className={`flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                      pathname?.startsWith('/admin/pro-users')
                        ? 'bg-amber-100 text-amber-800 font-semibold'
                        : 'text-amber-700 hover:bg-amber-50'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 shrink-0 text-amber-600" />
                    <span className="truncate">PRO Management</span>
                  </Link>
                </>
              )
            )}
          </div>
        </div>

        {/* Marketplace Section */}
        <div>
          {isCollapsed ? (
            <div className="pt-2 border-t border-gray-100">
              <Link
                href="/marketplace"
                title="Marketplace - All Items"
                className={`flex items-center justify-center p-2 rounded-md transition-colors ${
                  pathname?.startsWith('/marketplace')
                    ? 'bg-brand-50 text-brand-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-gray-500" />
              </Link>
            </div>
          ) : (
            <>
              <div className="px-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
                Marketplace
              </div>
              <div className="space-y-0.5">
                {CATEGORY_ITEMS.map((item) => {
                  const isMarketplaceActive = pathname === '/marketplace';
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                        isMarketplaceActive && item.href === '/marketplace'
                          ? 'bg-brand-50 text-brand-700 font-semibold'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Package className="w-4 h-4 shrink-0 text-gray-500" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer (Expanded mode only) */}
        {!isCollapsed && (
          <div className="pt-3 border-t border-gray-100 px-3 pb-2 text-[11px] text-gray-500 space-y-1">
            <div className="flex items-center gap-2 font-medium">
              <Link href="/privacy" className="hover:text-emerald-700 transition-colors">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="hover:text-emerald-700 transition-colors">
                Terms
              </Link>
            </div>
            <div className="text-[10px] text-gray-400">© 2026 BAUST Exchange</div>
          </div>
        )}
      </nav>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} />
    </aside>
  );
}
