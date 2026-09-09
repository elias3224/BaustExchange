'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
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

interface MobileNavProps {
  onClose?: () => void;
}

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

export function MobileNav({ onClose }: MobileNavProps) {
  const user = useSessionUser();
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white select-none py-3 px-3 space-y-5 overflow-y-auto">
      {/* Search Input for Mobile */}
      <form action="/marketplace" method="get" onSubmit={onClose} className="w-full">
        <input
          type="search"
          name="q"
          placeholder="Search items..."
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </form>

      {/* Main Navigation Links */}
      <div>
        <div className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
          Navigation
        </div>
        <div className="space-y-1">
          {NAV.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && item.href !== '/dashboard' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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

      {/* Marketplace Category Links */}
      <div>
        <div className="px-2 pb-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShoppingBag className="w-3.5 h-3.5 text-gray-400" />
          Marketplace Categories
        </div>
        <div className="space-y-1">
          {CATEGORY_ITEMS.map((item) => {
            const isMarketplaceActive = pathname === '/marketplace';
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
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

      {/* Logout & Footer Links */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <button
          onClick={() => {
            if (onClose) onClose();
            signOut({ callbackUrl: '/' });
          }}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0 text-red-500" />
          <span>Logout</span>
        </button>

        <div className="px-2 text-xs text-gray-500 space-y-1">
          <div className="flex items-center gap-2 font-medium">
            <Link href="/privacy" onClick={onClose} className="hover:text-emerald-700 transition-colors">Privacy Policy</Link>
            <span>•</span>
            <Link href="/terms" onClick={onClose} className="hover:text-emerald-700 transition-colors">Terms</Link>
          </div>
          <div className="text-[11px] text-gray-400">© 2026 BAUST Exchange</div>
        </div>
      </div>
    </div>
  );
}
