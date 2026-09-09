'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { formatPrice, timeAgo } from '@/lib/utils';
import { Edit, Trash2, Check, X } from 'lucide-react';

export function MyWantedItem({ item, categories = [] }: { item: any; categories?: { id: string; name: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [budget, setBudget] = useState(item.budget != null ? String(item.budget) : '');
  const [categoryId, setCategoryId] = useState(item.categoryId || '');
  const [error, setError] = useState('');

  async function updateStatus(status: string) {
    setBusy(true);
    try {
      await fetch(`/api/wanted/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const res = await fetch(`/api/wanted/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          budget: budget ? Number(budget) : null,
          categoryId: categoryId || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update wanted item');
      }
      setEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm('Delete this wanted item?')) return;
    setBusy(true);
    try {
      await fetch(`/api/wanted/${item.id}`, { method: 'DELETE' });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const statusColor =
    item.status === 'active' ? 'bg-green-100 text-green-800'
    : item.status === 'fulfilled' ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-600';

  if (editing) {
    return (
      <form onSubmit={handleSaveEdit} className="p-4 border border-brand-300 bg-brand-50/50 rounded-md space-y-3">
        <h4 className="text-xs font-semibold text-brand-700 uppercase">Edit Wanted Item</h4>
        {error && <div className="text-xs text-red-600">{error}</div>}
        <div>
          <label className="block text-xs font-medium mb-1">Title *</label>
          <input
            type="text" required value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md"
          />
        </div>
        {categories.length > 0 && (
          <div>
            <label className="block text-xs font-medium mb-1">Category</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium mb-1">Budget (৳)</label>
          <input
            type="number" value={budget} min="0"
            onChange={(e) => setBudget(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">Description</label>
          <textarea
            rows={2} value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md"
          />
        </div>
        <div className="flex gap-2 pt-1">
          <button
            type="submit" disabled={busy}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600"
          >
            <Check className="w-3.5 h-3.5" /> Save
          </button>
          <button
            type="button" onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="p-4 border border-gray-200 rounded-md bg-white">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium text-sm text-gray-800">{item.title}</h3>
          <div className="text-xs text-gray-500">{item.category?.name} • {timeAgo(item.createdAt)}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded ${statusColor}`}>{item.status}</span>
      </div>
      {item.description && <p className="text-xs text-gray-600 mt-2">{item.description}</p>}
      {item.budget != null && (
        <div className="text-xs text-green-700 mt-1 font-medium">Budget: {formatPrice(item.budget)}</div>
      )}
      <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-gray-100">
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-brand-300 text-brand-700 bg-brand-50 rounded-md hover:bg-brand-100"
        >
          <Edit className="w-3 h-3" /> Edit
        </button>
        {item.status === 'active' ? (
          <>
            <button
              onClick={() => updateStatus('fulfilled')} disabled={busy}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Mark Fulfilled
            </button>
            <button
              onClick={() => updateStatus('closed')} disabled={busy}
              className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
            >
              Close
            </button>
          </>
        ) : (
          <button
            onClick={() => updateStatus('active')} disabled={busy}
            className="text-xs px-2 py-1 border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Re-open
          </button>
        )}
        <button
          onClick={remove} disabled={busy}
          className="inline-flex items-center gap-1 text-xs px-2 py-1 border border-red-200 text-red-600 rounded-md hover:bg-red-50"
        >
          <Trash2 className="w-3 h-3" /> Delete
        </button>
      </div>
    </div>
  );
}