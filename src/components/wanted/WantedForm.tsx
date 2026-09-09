'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';

interface CategoryOpt { id: string; name: string }

export function WantedForm({ categories }: { categories: CategoryOpt[] }) {
  const router = useRouter();
  const [form, setForm] = useState({ title: '', categoryId: '', description: '', budget: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.categoryId) return setError('Title and category are required.');

    setSubmitting(true);
    try {
      const res = await fetch('/api/wanted', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          categoryId: form.categoryId,
          description: form.description || undefined,
          budget: form.budget ? Number(form.budget) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create wanted item');
      setSuccess('Wanted item added!');
      setForm({ title: '', categoryId: '', description: '', budget: '' });
      setTimeout(() => router.push('/wanted'), 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Add a Wanted Item</h1>
      <p className="text-sm text-gray-500">
        Looking for something? Post it here and we will notify you when a matching item is listed.
      </p>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200 rounded-md p-6">
        <div>
          <label className="block text-sm font-medium mb-1">What are you looking for? *</label>
          <input
            type="text" required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Thomas' Calculus 14th edition"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select
            required value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          >
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Details</label>
          <textarea
            rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Any specifics - edition, condition, size..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Budget (৳)</label>
          <input
            type="number" min="0" step="0.01" value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
            placeholder="Optional"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
          />
        </div>
        <button
          type="submit" disabled={submitting}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add Wanted Item'}
        </button>
      </form>
    </div>
  );
}