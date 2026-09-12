'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { formatPrice, timeAgo } from '@/lib/utils';

function useAdminAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(url: string, body: any = {}, method = 'PATCH') {
    setBusy(true); setError('');
    try {
      const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
      };
      if (method !== 'DELETE' && method !== 'GET') {
        options.body = JSON.stringify(body);
      }
      const res = await fetch(url, options);
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
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSelf = user.id === currentAdminId;

  return (
    <div className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 border-b border-gray-100 last:border-0">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? ''} className="w-9 h-9 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0 flex items-center justify-center font-bold text-gray-500 text-xs">
          {user.name?.[0] || 'U'}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">{user.name}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            user.role === 'admin' ? 'bg-purple-100 text-purple-800 border border-purple-200'
            : user.role === 'teacher' ? 'bg-blue-100 text-blue-800 border border-blue-200'
            : 'bg-gray-100 text-gray-700'
          }`}>
            {user.role}
          </span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
            user.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {user.status}
          </span>
          {user.isVerifiedSeller && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              Verified
            </span>
          )}
          {isSelf && <span className="text-[10px] text-gray-400 font-semibold">(you)</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          {user.email} • {user.department ?? 'No department'} • {user._count?.listings ?? 0} listing(s)
        </div>
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
      </div>

      {!isSelf && (
        <div className="flex flex-wrap gap-1.5 sm:justify-end w-full sm:w-auto">
          {user.role !== 'admin' && (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { role: 'admin' })}
              disabled={busy}
              className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-60 transition-colors"
            >
              Make Admin
            </button>
          )}
          {user.role !== 'teacher' && (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { role: 'teacher' })}
              disabled={busy}
              className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 text-gray-700 disabled:opacity-60 transition-colors"
            >
              Make Teacher
            </button>
          )}
          {user.status === 'active' ? (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { status: 'blocked' })}
              disabled={busy}
              className="px-2.5 py-1 text-xs font-semibold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-md disabled:opacity-60 transition-colors"
            >
              Block
            </button>
          ) : (
            <button
              onClick={() => run(`/api/admin/users/${user.id}`, { status: 'active' })}
              disabled={busy}
              className="px-2.5 py-1 text-xs font-semibold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              Unblock
            </button>
          )}

          {confirmDelete ? (
            <div className="inline-flex items-center gap-1">
              <button
                onClick={() => run(`/api/admin/users/${user.id}`, {}, 'DELETE')}
                disabled={busy}
                className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-md disabled:opacity-60 animate-pulse transition-colors"
              >
                Confirm Delete?
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={busy}
                className="px-2 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={busy}
              className="px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md disabled:opacity-60 transition-colors"
            >
              Delete User
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function AdminIdCardRow({ user }: { user: any }) {
  const { busy, error, run } = useAdminAction();
  const [confirmReject, setConfirmReject] = useState(false);

  return (
    <div className="border border-amber-200 rounded-md bg-amber-50/40 p-4 flex flex-col sm:flex-row gap-4">
      <a
        href={user.idCardUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-28 h-18 sm:w-36 shrink-0 bg-white border border-gray-200 rounded-md overflow-hidden"
        title="Open ID card in new tab"
      >
        {user.idCardUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.idCardUrl} alt={`ID card of ${user.name}`} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-[10px]">No image</div>
        )}
      </a>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-900">{user.name}</div>
        <div className="text-xs text-gray-600">
          {user.email} • <span className="capitalize font-semibold">{user.role}</span>
          {user.department ? ` • ${user.department}` : ''}
          {user.studentId ? ` • ID: ${user.studentId}` : ''}
        </div>
        <div className="text-[11px] text-gray-500 mt-0.5">Submitted {timeAgo(user.updatedAt)}</div>
        {user.idCardOcrNote && (
          <div
            className={`text-[11px] mt-1 font-semibold ${
              user.idCardOcrNote.startsWith('OCR PASS') ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {user.idCardOcrNote.startsWith('OCR PASS') ? '✓' : '⚠'} {user.idCardOcrNote}
          </div>
        )}
        {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        <div className="flex flex-wrap gap-2 mt-2">
          {confirmReject ? (
            <>
              <button
                onClick={() =>
                  run(`/api/admin/users/${user.id}`, {
                    idCardAction: 'reject',
                    idCardRejectReason: 'ID card could not be verified by admin review.',
                  })
                }
                disabled={busy}
                className="px-3 py-1 text-xs font-bold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60 animate-pulse"
              >
                Confirm Reject?
              </button>
              <button
                onClick={() => setConfirmReject(false)}
                disabled={busy}
                className="px-2.5 py-1 text-xs font-semibold border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => run(`/api/admin/users/${user.id}`, { idCardAction: 'approve' })}
                disabled={busy}
                className="px-3 py-1 text-xs font-bold text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60 shadow-xs"
              >
                Approve ID
              </button>
              <button
                onClick={() => setConfirmReject(true)}
                disabled={busy}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
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