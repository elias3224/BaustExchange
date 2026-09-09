'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bell, Check, CheckCheck, RefreshCw, Mail, CheckCircle, Shield, Heart, ExternalLink } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  type: string;
  message: string;
  referenceId?: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  request_new: <RefreshCw className="w-4 h-4 text-amber-500 shrink-0" />,
  request_accepted: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  request_rejected: <RefreshCw className="w-4 h-4 text-red-400 shrink-0" />,
  message: <Mail className="w-4 h-4 text-blue-500 shrink-0" />,
  listing_approved: <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />,
  admin: <Shield className="w-4 h-4 text-purple-500 shrink-0" />,
  match: <Heart className="w-4 h-4 text-pink-500 shrink-0" />,
};

export function NotificationBell() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    if (status !== 'authenticated') return;
    try {
      const res = await fetch('/api/notifications?limit=8', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications();
      // Real-time polling every 10 seconds
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllRead = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'POST' });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const getNotificationLink = (n: NotificationItem) => {
    if (!n.referenceId) return '/notifications';
    if (['request_new', 'request_accepted', 'request_rejected'].includes(n.type)) {
      return '/exchange-requests';
    }
    if (n.type === 'message') {
      return '/messages';
    }
    if (['listing_approved', 'match', 'admin'].includes(n.type)) {
      return `/item/${n.referenceId}`;
    }
    return '/notifications';
  };

  if (status !== 'authenticated') return null;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          fetchNotifications();
        }}
        className="relative p-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[11px] font-bold leading-none bg-red-500 text-white rounded-full border-2 border-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl py-0 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="text-xs text-brand-600 hover:text-brand-800 font-medium flex items-center gap-1 transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs font-medium">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 text-xs transition-colors flex items-start gap-2.5 relative group ${
                    n.isRead ? 'bg-white hover:bg-gray-50' : 'bg-brand-50/60 hover:bg-brand-50'
                  }`}
                >
                  <div className="mt-0.5">
                    {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-gray-400 shrink-0" />}
                  </div>

                  <div className="flex-1 min-w-0 pr-4">
                    <Link
                      href={getNotificationLink(n)}
                      onClick={() => {
                        if (!n.isRead) markAsRead(n.id);
                        setIsOpen(false);
                      }}
                      className="block hover:underline"
                    >
                      <p className={`line-clamp-2 ${n.isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {n.message}
                      </p>
                    </Link>
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(n.id);
                      }}
                      title="Mark as read"
                      className="text-gray-400 hover:text-brand-600 p-1 rounded hover:bg-white shrink-0 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-200 text-center">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-brand-700 hover:text-brand-800 flex items-center justify-center gap-1"
            >
              View all notifications
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

