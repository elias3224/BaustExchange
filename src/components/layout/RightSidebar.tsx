'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Bell,
  Heart,
  Package,
  Activity,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RoleBadge } from '@/components/ui/SessionContext';

// Lightweight fetches via the API route handlers.
async function fetchJSON(path: string) {
  const res = await fetch(path, { method: 'GET', cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export function RightSidebar() {
  const { data: session, status } = useSession();
  const user = (session?.user || ({} as any));

  // Sidebar collapse/expand state
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Section toggle states
  const [openSections, setOpenSections] = useState({
    quickActions: true,
    notifications: true,
    wanted: true,
    activity: true,
  });

  useEffect(() => {
    try {
      const savedCollapsed = localStorage.getItem('right_sidebar_collapsed');
      if (savedCollapsed !== null) {
        setIsCollapsed(JSON.parse(savedCollapsed));
      }
      const savedSections = localStorage.getItem('right_sidebar_sections');
      if (savedSections) {
        setOpenSections(JSON.parse(savedSections));
      }
    } catch {
      // fallback
    }
  }, []);

  function toggleSidebar() {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('right_sidebar_collapsed', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function toggleSection(key: keyof typeof openSections) {
    setOpenSections((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem('right_sidebar_sections', JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  if (status !== 'authenticated') {
    return null;
  }

  // Collapsed compact mini-sidebar view
  if (isCollapsed) {
    return (
      <aside className="hidden xl:flex flex-col items-center py-4 w-12 flex-shrink-0 h-full border-l border-gray-200 bg-white transition-all duration-300 select-none">
        <button
          onClick={toggleSidebar}
          title="Expand Right Sidebar"
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 mb-4"
        >
          <ChevronLeft className="w-5 h-5 text-brand-600" />
        </button>

        <div className="space-y-4 flex flex-col items-center">
          <Link href="/profile" title="View Profile">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-200" />
            )}
          </Link>

          <Link href="/post-item" title="Post Item" className="p-2 rounded-md text-gray-600 hover:bg-brand-50 hover:text-brand-600">
            <Package className="w-4 h-4" />
          </Link>

          <Link href="/post-wanted" title="Add Wanted Item" className="p-2 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-500">
            <Heart className="w-4 h-4" />
          </Link>

          <Link href="/notifications" title="Notifications" className="p-2 rounded-md text-gray-600 hover:bg-amber-50 hover:text-amber-500">
            <Bell className="w-4 h-4" />
          </Link>

          <button onClick={toggleSidebar} title="Recent Activity" className="p-2 rounded-md text-gray-600 hover:bg-purple-50 hover:text-purple-600">
            <Activity className="w-4 h-4" />
          </button>
        </div>
      </aside>
    );
  }

  // Expanded full sidebar view with collapsible section headers
  return (
    <aside className="hidden xl:flex flex-col w-[310px] flex-shrink-0 h-full border-l border-gray-200 bg-white overflow-y-auto transition-all duration-300">
      <div className="p-4 space-y-5">
        {/* User Card & Collapse Toggle Button */}
        <div className="pb-4 border-b border-gray-200">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Account Overview</span>
            <button
              onClick={toggleSidebar}
              title="Collapse Sidebar"
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name} className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gray-200 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-gray-900 truncate">{user?.name || 'User'}</div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <RoleBadge role={user?.role} />
                <span className="text-gray-300">•</span>
                <span className="capitalize">{user?.role}</span>
              </div>
              {user?.department && (
                <div className="text-xs text-gray-500 truncate mt-0.5">{user.department}</div>
              )}
            </div>
          </div>
          <Link href="/profile" className="block mt-3 text-center text-xs font-medium text-brand-600 hover:underline">
            View Profile &rarr;
          </Link>
        </div>

        {/* Quick Actions (Collapsible) */}
        <div className="border-b border-gray-100 pb-3">
          <button
            onClick={() => toggleSection('quickActions')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 hover:text-gray-600"
          >
            <span>Quick Actions</span>
            {openSections.quickActions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {openSections.quickActions && (
            <div className="space-y-2">
              <Link
                href="/post-item"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-brand-500 text-white rounded-md hover:bg-brand-600 transition-colors shadow-sm"
              >
                <Package className="w-4 h-4" /> Post Item
              </Link>
              <Link
                href="/post-wanted"
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Heart className="w-4 h-4 text-red-500" /> Add Wanted Item
              </Link>
            </div>
          )}
        </div>

        {/* Notifications (Collapsible) */}
        <div className="border-b border-gray-100 pb-3">
          <button
            onClick={() => toggleSection('notifications')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 hover:text-gray-600"
          >
            <span className="flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-gray-400" /> Recent notifications
            </span>
            {openSections.notifications ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {openSections.notifications && <NotificationFeed />}
        </div>

        {/* Active Wanted Items (Collapsible) */}
        <div className="border-b border-gray-100 pb-3">
          <button
            onClick={() => toggleSection('wanted')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 hover:text-gray-600"
          >
            <span className="flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5 text-gray-400" /> Active wanted items
            </span>
            {openSections.wanted ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {openSections.wanted && <WantedFeed />}
        </div>

        {/* Recent Activity (Collapsible) */}
        <div>
          <button
            onClick={() => toggleSection('activity')}
            className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5 hover:text-gray-600"
          >
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-gray-400" /> Recent activity
            </span>
            {openSections.activity ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {openSections.activity && <ActivityFeed />}
        </div>
      </div>
    </aside>
  );
}

function NotificationFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetchJSON('/api/notifications?limit=5')
      .then((data) => setItems(data?.notifications ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items.length) {
    return <p className="text-xs text-gray-500 italic">No notifications.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
          <span className={n.isRead ? '' : 'font-medium text-gray-900'}>{n.message}</span>
          <div className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()}</div>
        </li>
      ))}
    </ul>
  );
}

function WantedFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetchJSON('/api/wanted?limit=3&active=true')
      .then((data) => setItems(data?.items ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items.length) {
    return <p className="text-xs text-gray-500 italic">No wanted items.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((w) => (
        <li key={w.id} className="text-xs bg-gray-50 p-2 rounded border border-gray-100 flex items-center justify-between">
          <span className="text-gray-800 font-medium truncate">{w.title}</span>
          {w.budget && <span className="text-brand-600 font-semibold shrink-0 ml-1">৳{w.budget}</span>}
        </li>
      ))}
    </ul>
  );
}

function ActivityFeed() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    fetchJSON('/api/activities?limit=5')
      .then((data) => setItems(data?.activities ?? []))
      .catch(() => setItems([]));
  }, []);
  if (!items.length) {
    return <p className="text-xs text-gray-500 italic">No recent activity.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
          <span>{a.description}</span>
          <div className="text-[10px] text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</div>
        </li>
      ))}
    </ul>
  );
}
