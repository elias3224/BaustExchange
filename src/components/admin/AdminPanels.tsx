'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, timeAgo } from '@/lib/utils';

function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(url: string, body: any, method = 'PATCH') {
    setBusy(true); setError('');
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, run };
}

export function AdminListingRow({ listing }: { listing: any }) {
  const { busy, error, run } = useAdminAction();

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4 flex gap-4">
      <Link href={`/item/${listing.id}`} className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
        {listing.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No image</div>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/item/${listing.id}`} className="text-sm font-medium hover:underline line-clamp-1">
            {listing.title}
          </Link>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {listing.transactionType === 'give_away' ? 'FREE' : formatPrice(listing.price ?? 0)}
          </span>
        </div>
        <div className="text-xs text-gray-500">
          {listing.category?.name} • by {listing.user?.name} ({listing.user?.email}) • {timeAgo(listing.createdAt)}
        </div>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => run(`/api/admin/listings/${listing.id}`, { action: 'approve' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            Approve
          </button>
          <button
            onClick={() => run(`/api/admin/listings/${listing.id}`, { action: 'reject' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  );
}

const REPORT_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  reviewed: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  dismissed: 'bg-gray-100 text-gray-600',
};

export function AdminReportRow({ report }: { report: any }) {
  const { busy, error, run } = useAdminAction();

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-sm font-medium">{report.reason}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            Reported by {report.reporter?.name ?? 'unknown'} • {timeAgo(report.createdAt)}
          </div>
          {report.listing && (
            <div className="text-xs mt-1">
              Listing:{' '}
              <Link href={`/item/${report.listing.id}`} className="text-brand-600 hover:underline">
                {report.listing.title}
              </Link>{' '}
              <span className="text-gray-400">({report.listing.status})</span>
            </div>
          )}
          {report.description && (
            <p className="text-xs text-gray-600 mt-2 bg-gray-50 border border-gray-100 rounded-md p-2">
              {report.description}
            </p>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${REPORT_STATUS_COLOR[report.status] || 'bg-gray-100'}`}>
          {report.status}
        </span>
      </div>

      {error && <div className="text-xs text-red-600 mt-2">{error}</div>}

      <div className="flex flex-wrap gap-2 mt-3">
        {report.status === 'pending' && (
          <button
            onClick={() => run(`/api/admin/reports/${report.id}`, { status: 'reviewed' })}
            disabled={busy}
            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60"
          >
            Mark Reviewed
          </button>
        )}
        {report.status !== 'resolved' && (
          <button
            onClick={() => run(`/api/admin/reports/${report.id}`, { status: 'resolved' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
          >
            Resolve
          </button>
        )}
        {report.status !== 'dismissed' && (
          <button
            onClick={() => run(`/api/admin/reports/${report.id}`, { status: 'dismissed' })}
            disabled={busy}
            className="px-3 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60"
          >
            Dismiss
          </button>
        )}
        {report.listing && report.listing.status === 'active' && (
          <button
            onClick={() => run(`/api/admin/listings/${report.listing.id}`, { action: 'remove' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60"
          >
            Remove Listing
          </button>
        )}
      </div>
    </div>
  );
}

export function AdminUserRow({ user, currentAdminId }: { user: any; currentAdminId: string }) {
  const { busy, error, run } = useAdminAction();
  const isSelf = user.id === currentAdminId;

  return (
    <div className="p-4 flex items-center gap-3">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ''} className="w-9 h-9 rounded-full object-cover" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-200" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2">
          {user.name}
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            user.role === 'admin' ? 'bg-purple-100 text-purple-800'
            : user.role === 'teacher' ? 'bg-blue-100 text-blue-800'
            : 'bg-gray-100 text-gray-700'
          }`}>
            {user.role}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
            user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {user.status}
          </span>
          {isSelf && <span className="text-[10px] text-gray-400">(you)</span>}
        </div>
        <div className="text-xs text-gray-500">
          {user.email} • {user.department ?? 'No department'} • {user._count?.listings ?? 0} listing(s)
        </div>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>

      {!isSelf && (
        <div className="flex flex-wrap gap-2 justify-end">
          {user.role !== 'admin' && (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { role: 'admin' })}
              disabled={busy}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60"
            >
              Make Admin
            </button>
          )}
          {user.role !== 'teacher' && (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { role: 'teacher' })}
              disabled={busy}
              className="px-2 py-1 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60"
            >
              Make Teacher
            </button>
          )}
          {user.status === 'active' ? (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { status: 'blocked' })}
              disabled={busy}
              className="px-2 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60"
            >
              Block
            </button>
          ) : (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { status: 'active' })}
              disabled={busy}
              className="px-2 py-1 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60"
            >
              Unblock
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminPaymentRow({ payment }: { payment: any }) {
  const { busy, error, run } = useAdminAction();

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
          <span>{payment.paymentMethod}</span>
          <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-xs">৳{payment.amount}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-semibold ${
            payment.status === 'approved' ? 'bg-green-100 text-green-800'
            : payment.status === 'rejected' ? 'bg-red-100 text-red-800'
            : 'bg-amber-100 text-amber-800'
          }`}>
            {payment.status}
          </span>
        </div>
        <div className="text-xs text-gray-600 mt-1">
          User: <strong>{payment.user?.name}</strong> ({payment.user?.email}) • Phone: <span className="font-mono">{payment.senderPhone}</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          TrxID: <strong className="font-mono text-gray-800 uppercase">{payment.trxId}</strong> • Type: <span className="font-medium">{payment.type}</span> {payment.listingId ? `(Item: ${payment.listingId})` : ''} • {timeAgo(payment.createdAt)}
        </div>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>

      {payment.status === 'pending' && (
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => run(`/api/admin/payments/${payment.id}`, { status: 'approved' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60 shadow-xs"
          >
            Approve & Activate
          </button>
          <button
            onClick={() => run(`/api/admin/payments/${payment.id}`, { status: 'rejected' })}
            disabled={busy}
            className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60"
          >
            Reject
          </button>
        </div>
      )}
    </div>
  );
}