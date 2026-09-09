'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CONDITION_LABELS, STATUS_LABELS, TRANSACTION_LABELS, formatPrice, timeAgo } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['active', 'sold', 'exchanged', 'given'];

export function MyListingCard({ listing }: { listing: any }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function updateStatus(status: string) {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Update failed');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete "${listing.title}"? This cannot be undone.`)) return;
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/listings/${listing.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Delete failed');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  const statusColor: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-amber-100 text-amber-800',
    sold: 'bg-blue-100 text-blue-800',
    exchanged: 'bg-purple-100 text-purple-800',
    given: 'bg-teal-100 text-teal-800',
    rejected: 'bg-red-100 text-red-800',
    removed: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="border border-gray-200 rounded-md bg-white overflow-hidden flex flex-col sm:flex-row">
      <Link href={`/item/${listing.id}`} className="w-full sm:w-32 h-32 flex-shrink-0 bg-gray-100 relative">
        {listing.images?.[0]?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.images[0].url} alt={listing.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
        )}
      </Link>
      <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link href={`/item/${listing.id}`} className="font-medium text-sm text-gray-800 line-clamp-1 hover:underline">
              {listing.title}
            </Link>
            <span className={`text-xs px-2 py-0.5 rounded whitespace-nowrap ${statusColor[listing.status] || 'bg-gray-100'}`}>
              {STATUS_LABELS[listing.status] || listing.status}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {listing.category?.name ?? 'Uncategorized'} • {TRANSACTION_LABELS[listing.transactionType] || listing.transactionType} • {CONDITION_LABELS[listing.condition] || listing.condition}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
            <span className="text-sm font-medium text-gray-800">
              {listing.transactionType === 'give_away' ? 'FREE' : formatPrice(listing.price ?? 0)}
            </span>
            <span>{listing._count?.requests ?? 0} request(s)</span>
            <span>{timeAgo(listing.createdAt)}</span>
          </div>
          {error && <div className="text-xs text-red-600 mt-1">{error}</div>}
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100">
          <Link
            href={`/item/${listing.id}/edit`}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-brand-300 text-brand-700 bg-brand-50 rounded-md hover:bg-brand-100 transition-colors"
          >
            <Edit className="w-3 h-3" /> Edit
          </Link>
          {STATUS_OPTIONS.filter((s) => s !== listing.status).map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={busy || listing.status === 'rejected' || listing.status === 'removed'}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              Mark {STATUS_LABELS[s]}
            </button>
          ))}
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-2.5 py-1 border border-red-200 text-red-600 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}