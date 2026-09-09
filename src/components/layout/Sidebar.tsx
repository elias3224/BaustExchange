'use client';

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
} from 'lucide-react';
import { useSessionUser } from '@/components/ui/SessionContext';

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

  return (
    <aside className="hidden lg:flex flex-col w-[260px] flex-shrink-0 h-full border-r border-gray-200 bg-white select-none overflow-hidden">
      <nav className="flex-1 py-3 px-2 space-y-4 overflow-y-auto">
        <div>
          <div className="px-3 pb-1 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            Navigation
          </div>
          <div className="space-y-0.5">
            {NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/dashboard' && pathname?.startsWith(item.href));
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
                  <item.icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-brand-600' : 'text-gray-500'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}

            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className={`flex items-center gap-2.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                  pathname?.startsWith('/admin')
                    ? 'bg-purple-100 text-purple-800 font-semibold'
                    : 'text-purple-700 hover:bg-purple-50'
                }`}
              >
                <Shield className="w-4 h-4 shrink-0 text-purple-600" />
                <span className="truncate">Admin Panel</span>
              </Link>
            )}
          </div>
        </div>

        <div>
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
        </div>

        <div className="pt-3 border-t border-gray-100 px-3 pb-2 text-[11px] text-gray-500 space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <Link href="/privacy" className="hover:text-emerald-700 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" className="hover:text-emerald-700 transition-colors">Terms</Link>
          </div>
          <div className="text-[10px] text-gray-400">© 2026 BAUST Exchange</div>
        </div>
      </nav>
    </aside>
  );
}
