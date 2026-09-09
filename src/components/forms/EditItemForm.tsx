'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';

interface CategoryOpt { id: string; name: string }

export default function EditItemForm({
  listing,
  categories,
}: {
  listing: any;
  categories: CategoryOpt[];
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: listing.title || '',
    description: listing.description || '',
    categoryId: listing.categoryId || '',
    condition: listing.condition || 'new',
    transactionType: listing.transactionType || 'sell',
    price: listing.price != null ? String(listing.price) : '',
    quantity: listing.quantity != null ? String(listing.quantity) : '1',
    exchangeFor: listing.exchangeFor || '',
    location: listing.location || '',
    contactPreference: listing.contactPreference || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const qtyNum = Math.max(1, Number(form.quantity) || 1);
  const priceNum = Number(form.price) || 0;
  const totalPrice = priceNum * qtyNum;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.categoryId) return setError('Title and category are required.');

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        price: form.price ? Number(form.price) : null,
        quantity: form.quantity ? Math.max(1, Number(form.quantity)) : 1,
      };
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update listing');

      setSuccess('Listing updated successfully!');
      setTimeout(() => router.push(`/item/${listing.id}`), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Edit Listing</h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:underline"
        >
          Cancel
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 border border-gray-200 rounded-md shadow-sm">
        <div>
          <label className="block text-sm font-medium mb-1">Item Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Condition</label>
            <select
              value={form.condition}
              onChange={(e) => setForm({ ...form, condition: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="new">New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good</option>
              <option value="used">Used</option>
              <option value="damaged">Damaged</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Transaction Type</label>
            <select
              value={form.transactionType}
              onChange={(e) => setForm({ ...form, transactionType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="sell">Sell</option>
              <option value="exchange">Exchange</option>
              <option value="give_away">Give Away</option>
              <option value="sell_or_exchange">Sell or Exchange</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Available Quantity (Item Count) *</label>
          <input
            type="number"
            min="1"
            required
            value={form.quantity || '1'}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            placeholder="1"
          />
        </div>

        {form.transactionType !== 'give_away' && (
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Price per Item (৳)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="e.g. 1500"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            {qtyNum > 1 && priceNum > 0 && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-md text-xs font-semibold text-emerald-800 flex items-center justify-between">
                <span>Total Stock Price ({qtyNum} items):</span>
                <span className="text-sm font-bold">৳{totalPrice.toLocaleString()} <span className="text-[10px] font-normal text-emerald-700">(৳{priceNum} × {qtyNum})</span></span>
              </div>
            )}
          </div>
        )}

        {(form.transactionType === 'exchange' || form.transactionType === 'sell_or_exchange') && (
          <div>
            <label className="block text-sm font-medium mb-1">Looking for (Exchange item)</label>
            <input
              type="text"
              value={form.exchangeFor}
              onChange={(e) => setForm({ ...form, exchangeFor: e.target.value })}
              placeholder="e.g. Scientific Calculator or Graphics Tablet"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Campus Location</label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. CSE Department / Hall 1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Info / Preference</label>
            <input
              type="text"
              value={form.contactPreference}
              onChange={(e) => setForm({ ...form, contactPreference: e.target.value })}
              placeholder="e.g. WhatsApp 017xxxxxxxx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
