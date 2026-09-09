'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bell, RefreshCw, Mail, CheckCircle, Shield, Heart } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

const TYPE_ICON: Record<string, React.ReactNode> = {
  request_new: <RefreshCw className="w-4 h-4 text-amber-500" />,
  request_accepted: <CheckCircle className="w-4 h-4 text-green-500" />,
  request_rejected: <RefreshCw className="w-4 h-4 text-red-400" />,
  message: <Mail className="w-4 h-4 text-blue-500" />,
  listing_approved: <CheckCircle className="w-4 h-4 text-green-500" />,
  admin: <Shield className="w-4 h-4 text-purple-500" />,
  match: <Heart className="w-4 h-4 text-pink-500" />,
};

export function NotificationsClient({ notifications }: { notifications: any[] }) {
  const router = useRouter();

  async function markAll() {
    await fetch('/api/notifications', { method: 'POST' });
    router.refresh();
  }

  async function markOne(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'POST' });
    router.refresh();
  }

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={markAll}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Mark all read ({unread})
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-10 h-10" />}
          title="No notifications"
          description="Requests, messages and matches will show up here."
        />
      ) : (
        <ul className="space-y-2">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start gap-3 p-4 border rounded-md ${
                n.isRead ? 'border-gray-200 bg-white' : 'border-brand-200 bg-brand-50'
              }`}
            >
              <div className="mt-0.5">{TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-400" />}</div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                  {n.message}
                </div>
                <div className="text-xs text-gray-400 mt-1">{timeAgo(n.createdAt)}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {!n.isRead && (
                  <button
                    onClick={() => markOne(n.id)}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Mark read
                  </button>
                )}
                {n.referenceId && ['request_new', 'request_accepted', 'request_rejected'].includes(n.type) && (
                  <Link href="/exchange-requests" className="text-xs text-gray-500 hover:underline">
                    View request
                  </Link>
                )}
                {n.referenceId && ['listing_approved', 'match', 'admin'].includes(n.type) && (
                  <Link href={`/item/${n.referenceId}`} className="text-xs text-gray-500 hover:underline">
                    View item
                  </Link>
                )}
                {n.referenceId && n.type === 'message' && (
                  <Link href="/messages" className="text-xs text-gray-500 hover:underline">
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