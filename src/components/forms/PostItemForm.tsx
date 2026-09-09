'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui/Alert';
import { PostItemFields } from './PostItemFields';
import { ImageUploader } from './ImageUploader';

interface CategoryOpt { id: string; name: string }

interface FormState {
  title: string; description: string; categoryId: string; condition: string;
  transactionType: string; price: string; quantity: string; exchangeFor: string; location: string; contactPreference: string;
}

export default function PostItemPage({ categories }: { categories: CategoryOpt[] }) {
  const router = useRouter();
  const { status } = useSession();
  const [form, setForm] = useState<FormState>({
    title: '', description: '', categoryId: '', condition: 'new',
    transactionType: 'sell', price: '', quantity: '1', exchangeFor: '', location: '', contactPreference: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isFreeType = form.transactionType === 'give_away';

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) return setError('Maximum 6 images allowed.');
    setImages((p) => [...p, ...files]);
    files.forEach((f) => setPreviews((p) => [...p, URL.createObjectURL(f)]));
  }

  function removeImage(idx: number) {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => { const n = [...p]; n.splice(idx, 1); return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.categoryId) return setError('Title and category are required.');
    if (form.transactionType === 'sell' && (!form.price || Number(form.price) <= 0))
      return setError('A price is required for "Sell" listings.');
    if ((form.transactionType === 'exchange' || form.transactionType === 'sell_or_exchange') && !form.exchangeFor)
      return setError('"What are you looking for?" is required for exchange listings.');

    setSubmitting(true);
    try {
      const urls: string[] = [];
      for (const file of images) {
        const fd = new FormData();
        fd.append('file', file, file.name);
        const res = await fetch('/api/upload', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload failed');
        urls.push(data.url);
      }
      const payload = { ...form, price: form.price ? Number(form.price) : null, quantity: form.quantity ? Math.max(1, Number(form.quantity)) : 1, images: urls };
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');
      setSuccess('Listing created successfully!');
      setTimeout(() => router.push(`/item/${data.id}`), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'loading') return <p className="text-gray-500">Loading…</p>;
  if (status !== 'authenticated') return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Post an Item</h1>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUploader previews={previews} images={images} onRemove={removeImage} onAdd={handleImageChange} />
        <div>
          <label className="block text-sm font-medium mb-1">Item Name *</label>
          <input type="text" required value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Category *</label>
          <select required value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500">
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea required value={form.description} rows={4}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500" />
        </div>
        <PostItemFields form={form} setForm={setForm} isFreeType={isFreeType} />
        <div className="pt-2">
          <button type="submit" disabled={submitting}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-60">
            {submitting ? 'Posting…' : 'Post Item'}
          </button>
        </div>
      </form>
    </div>
  );
}
