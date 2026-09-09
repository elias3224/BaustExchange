'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { formatPrice, timeAgo } from '@/lib/utils';

const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-blue-100 text-blue-800',
};

export function RequestCard({ request, direction }: { request: any; direction: 'incoming' | 'outgoing' }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const other = direction === 'incoming' ? request.sender : request.receiver;

  async function act(action: string) {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/exchange-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="border border-gray-200 rounded-md bg-white p-4">
      <div className="flex gap-3 sm:gap-4">
        {/* Item thumbnail (non-clickable when the listing no longer exists) */}
        {request.listing?.id ? (
          <Link href={`/item/${request.listing.id}`} className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
            {request.listing?.images?.[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={request.listing.images[0].url} alt={request.listing.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
            )}
          </Link>
        ) : (
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="text-sm">
                <span className="font-medium">{direction === 'incoming' ? (other?.name ?? 'Someone') : 'You'}</span>
                {' '}{direction === 'incoming' ? 'wants your' : 'requested'}{' '}
                {request.listing?.id ? (
                  <Link href={`/item/${request.listing.id}`} className="text-brand-600 hover:underline">
                    {request.listing.title}
                  </Link>
                ) : (
                  <span className="text-gray-500">a listing</span>
                )}
                {request.listing && (
                  <span className="text-gray-500"> ({request.listing.transactionType === 'give_away' ? 'FREE' : formatPrice(request.listing.price ?? 0)})</span>
                )}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{timeAgo(request.createdAt)}</div>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${STATUS_COLOR[request.status] || 'bg-gray-100'}`}>
              {request.status}
            </span>
          </div>

          <p className="text-sm text-gray-600 mt-2">{request.message}</p>
          {request.offeredItem && (
            <p className="text-xs text-gray-500 mt-1">Offering: {request.offeredItem}</p>
          )}

          {error && <div className="mt-2"><Alert type="error">{error}</Alert></div>}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {direction === 'incoming' && request.status === 'pending' && (
              <>
                <button onClick={() => act('accept')} disabled={busy}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-60">
                  Accept
                </button>
                <button onClick={() => act('reject')} disabled={busy}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60">
                  Reject
                </button>
              </>
            )}
            {direction === 'outgoing' && request.status === 'pending' && (
              <button onClick={() => act('cancel')} disabled={busy}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-60">
                Cancel Request
              </button>
            )}
            {request.status === 'accepted' && (
              <button onClick={() => act('complete')} disabled={busy}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60">
                Mark Completed
              </button>
            )}
            {other?.id && (
              <Link
                href={`/messages?with=${other.id}`}
                className="px-3 py-1.5 text-xs border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Message {direction === 'incoming' ? other.name?.split(' ')[0] : 'them'}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}