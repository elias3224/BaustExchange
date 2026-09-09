'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, RefreshCw, Mail, CheckCircle, Shield, Heart, CheckCheck } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ReactNode> = {
  request_new: <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />,
  request_accepted: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  request_rejected: <RefreshCw className="w-4 h-4 text-red-400 shrink-0" />,
  message: <Mail className="w-4 h-4 text-blue-500 shrink-0" />,
  listing_approved: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  admin: <Shield className="w-4 h-4 text-purple-500 shrink-0" />,
  match: <Heart className="w-4 h-4 text-pink-500 shrink-0" />,
};

export function NotificationsClient({ notifications: initialNotifications }: { notifications: any[] }) {
  const router = useRouter();
  const [items, setItems] = useState<any[]>(initialNotifications);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setItems(initialNotifications);
  }, [initialNotifications]);

  // Real-time background sync every 10 seconds
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/notifications?limit=50', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.notifications) {
            setItems(data.notifications);
          }
        }
      } catch (err) {
        console.error('Failed to sync notifications:', err);
      }
    };

    const interval = setInterval(fetchLatest, 10000);
    return () => clearInterval(interval);
  }, []);

  async function markAll() {
    setLoading(true);
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch('/api/notifications', { method: 'POST' });
      router.refresh();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  }

  async function markOne(id: string) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch(`/api/notifications?id=${id}`, { method: 'POST' });
      router.refresh();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  }

  const unread = items.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Notifications</h1>
          <p className="text-xs text-gray-500 mt-0.5">Stay updated on exchange requests, messages, and listings</p>
        </div>
        {unread > 0 && (
          <button
            onClick={markAll}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-md flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read ({unread})
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10" />}
          title="No notifications yet"
          description="Requests, messages, matches, and account notices will appear here automatically."
        />
      ) : (
        <ul className="space-y-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 p-4 border rounded-lg transition-all ${
                n.isRead
                  ? 'border-gray-200 bg-white hover:border-gray-300'
                  : 'border-brand-200 bg-brand-50/70 hover:bg-brand-50 shadow-2xs'
              }`}
            >
              <div className="mt-0.5 p-1.5 rounded-full bg-white shadow-2xs border border-gray-100">
                {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-400 shrink-0" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${n.isRead ? 'text-gray-700' : 'text-gray-900 font-semibold'}`}>
                  {n.message}
                </div>
                <div className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {!n.isRead && (
                  <button
                    onClick={() => markOne(n.id)}
                    className="text-xs text-brand-600 font-medium hover:underline bg-white px-2 py-0.5 rounded border border-brand-200"
                  >
                    Mark read
                  </button>
                )}
                {n.referenceId && ['request_new', 'request_accepted', 'request_rejected'].includes(n.type) && (
                  <Link href="/exchange-requests" className="text-xs font-medium text-gray-600 hover:text-brand-600 hover:underline">
                    View request
                  </Link>
                )}
                {n.referenceId && ['listing_approved', 'match', 'admin'].includes(n.type) && (
                  <Link href={`/item/${n.referenceId}`} className="text-xs font-medium text-gray-600 hover:text-brand-600 hover:underline">
                    View item
                  </Link>
                )}
                {n.referenceId && n.type === 'message' && (
                  <Link href="/messages" className="text-xs font-medium text-gray-600 hover:text-brand-600 hover:underline">
                    Open messages
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}