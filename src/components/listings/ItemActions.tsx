'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { REPORT_REASONS } from '@/lib/utils';
import { Heart, Edit } from 'lucide-react';

export function ItemActions({
  listingId,
  listingTitle,
  ownerId,
  ownerName,
  status,
  isOwner,
}: {
  listingId: string;
  listingTitle: string;
  ownerId: string;
  ownerName: string;
  status: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  // Favorite / Save feature
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saved_listings') || '[]');
      setIsSaved(saved.includes(listingId));
    } catch {
      setIsSaved(false);
    }
  }, [listingId]);

  function toggleSave() {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('saved_listings') || '[]');
      let updated: string[];
      if (saved.includes(listingId)) {
        updated = saved.filter((id) => id !== listingId);
        setIsSaved(false);
        setSuccess('Item removed from saved favorites.');
      } else {
        updated = [...saved, listingId];
        setIsSaved(true);
        setSuccess('Item saved to your favorites!');
      }
      localStorage.setItem('saved_listings', JSON.stringify(updated));
    } catch {
      // fallback
    }
  }

  // Exchange request form
  const [showRequest, setShowRequest] = useState(false);
  const [message, setMessage] = useState('');
  const [offeredItem, setOfferedItem] = useState('');

  // Report form
  const [showReport, setShowReport] = useState(false);
  const [reason, setReason] = useState(REPORT_REASONS[0] as string);
  const [description, setDescription] = useState('');

  const closed = ['sold', 'exchanged', 'given', 'rejected', 'removed'].includes(status);

  async function sendRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setBusy(true);
    try {
      const res = await fetch('/api/exchange-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, message, offeredItem: offeredItem || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send request');
      setSuccess('Request sent! The owner has been notified.');
      setShowRequest(false);
      setMessage('');
      setOfferedItem('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function messageSeller() {
    setError(''); setBusy(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: ownerId,
          listingId,
          message: `Hi! I'm interested in "${listingTitle}".`,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }
      router.push(`/messages?with=${ownerId}`);
    } catch (err: any) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function submitReport(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess(''); setBusy(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, reason, description: description || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit report');
      }
      setSuccess('Report submitted. An admin will review it.');
      setShowReport(false);
      setDescription('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function ownerSetStatus(newStatus: string) {
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/listings/${listingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
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

  if (isOwner) {
    return (
      <div className="space-y-3">
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        <div className="text-xs font-semibold text-gray-400 uppercase">This is your listing</div>
        
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/item/${listingId}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 shadow-sm"
          >
            <Edit className="w-4 h-4" /> Edit Listing
          </Link>

          {status !== 'active' && (
            <button onClick={() => ownerSetStatus('active')} disabled={busy}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
              Mark Active
            </button>
          )}
          {status !== 'sold' && (
            <button onClick={() => ownerSetStatus('sold')} disabled={busy}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
              Mark Sold
            </button>
          )}
          {status !== 'exchanged' && (
            <button onClick={() => ownerSetStatus('exchanged')} disabled={busy}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
              Mark Exchanged
            </button>
          )}
          {status !== 'given' && (
            <button onClick={() => ownerSetStatus('given')} disabled={busy}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-100">
              Mark Given
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div className="flex flex-wrap gap-2">
        {!closed && (
          <button
            onClick={() => { setShowRequest(!showRequest); setShowReport(false); }}
            className="flex-1 min-w-[200px] px-4 py-2.5 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 active:bg-brand-700 shadow-sm"
          >
            Request / Buy this Item
          </button>
        )}

        <button
          onClick={toggleSave}
          title={isSaved ? 'Unsave item' : 'Save item'}
          className={`p-2.5 border rounded-md transition-colors flex items-center justify-center ${
            isSaved ? 'border-red-300 bg-red-50 text-red-600' : 'border-gray-300 hover:bg-gray-100 text-gray-600'
          }`}
        >
          <Heart className={`w-5 h-5 ${isSaved ? 'fill-red-600' : ''}`} />
        </button>
      </div>

      <button
        onClick={messageSeller}
        disabled={busy}
        className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
      >
        Message {ownerName}
      </button>

      <button
        onClick={() => { setShowReport(!showReport); setShowRequest(false); }}
        className="w-full text-xs text-gray-400 hover:text-red-500"
      >
        Report this listing
      </button>

      {showRequest && (
        <form onSubmit={sendRequest} className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
          <div>
            <label className="block text-xs font-medium mb-1">Message to {ownerName} *</label>
            <textarea
              required rows={3} value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`Hi, I'd like to get "${listingTitle}"...`}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">What can you offer in exchange?</label>
            <input
              type="text" value={offeredItem}
              onChange={(e) => setOfferedItem(e.target.value)}
              placeholder="e.g. my old graphing calculator"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button type="submit" disabled={busy}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-60">
            {busy ? 'Sending…' : 'Send Request'}
          </button>
        </form>
      )}

      {showReport && (
        <form onSubmit={submitReport} className="space-y-3 border border-gray-200 rounded-md p-4 bg-gray-50">
          <div>
            <label className="block text-xs font-medium mb-1">Reason *</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md">
              {REPORT_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Details</label>
            <textarea
              rows={2} value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <button type="submit" disabled={busy}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-md hover:bg-red-600 disabled:opacity-60">
            {busy ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      )}
    </div>
  );
}