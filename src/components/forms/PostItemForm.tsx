'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Alert } from '@/components/ui/Alert';
import { PostItemFields } from './PostItemFields';
import { ImageUploader } from './ImageUploader';
import { Sparkles, CheckCircle2, ArrowRight, ShoppingBag, Eye, Lock } from 'lucide-react';

interface CategoryOpt { id: string; name: string }

interface FormState {
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  transactionType: string;
  price: string;
  quantity: string;
  exchangeFor: string;
  location: string;
  contactPreference: string;
}

export default function PostItemPage({ categories }: { categories: CategoryOpt[] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    categoryId: '',
    condition: 'new',
    transactionType: 'sell',
    price: '',
    quantity: '1',
    exchangeFor: '',
    location: '',
    contactPreference: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState('');
  const [error, setError] = useState('');
  const [createdListing, setCreatedListing] = useState<any | null>(null);

  const isFreeType = form.transactionType === 'give_away';

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 6) return setError('Maximum 6 images allowed.');
    setImages((p) => [...p, ...files]);
    files.forEach((f) => setPreviews((p) => [...p, URL.createObjectURL(f)]));
  }

  function removeImage(idx: number) {
    setImages((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => {
      const n = [...p];
      n.splice(idx, 1);
      return n;
    });
  }

  // Handle AI Auto-Fill with Photo
  async function handleAiAutoFill() {
    setError('');
    setAiSuccessMsg('');

    if (images.length === 0 && !form.title) {
      return setError('Please upload at least one photo or type a short title hint for AI analysis.');
    }

    setAiLoading(true);

    try {
      let imageBase64: string | undefined = undefined;

      // Convert first image to base64 if available
      if (images.length > 0) {
        const file = images[0];
        imageBase64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      const res = await fetch('/api/listings/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleHint: form.title || undefined,
          imageBase64,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isProRequired) {
          setError(
            '✨ AI Auto-Fill is an exclusive Campus PRO feature! Please upgrade to PRO to use automatic AI photo analysis.'
          );
          return;
        }
        throw new Error(data.error || 'AI analysis failed');
      }

      const { suggestion } = data;
      setForm((prev) => ({
        ...prev,
        title: suggestion.title || prev.title,
        description: suggestion.description || prev.description,
        categoryId: suggestion.categoryId || prev.categoryId,
        condition: suggestion.condition || prev.condition,
        price: suggestion.price ? String(suggestion.price) : prev.price,
      }));

      setAiSuccessMsg(
        '✨ AI successfully analyzed your item! Review or edit any details below before publishing.'
      );
    } catch (err: any) {
      setError(err.message || 'Failed to auto-fill with AI.');
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.title || !form.categoryId) return setError('Title and category are required.');
    if (form.transactionType === 'sell' && (!form.price || Number(form.price) <= 0))
      return setError('A price is required for "Sell" listings.');
    if (
      (form.transactionType === 'exchange' || form.transactionType === 'sell_or_exchange') &&
      !form.exchangeFor
    )
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

      const payload = {
        ...form,
        price: form.price ? Number(form.price) : null,
        quantity: form.quantity ? Math.max(1, Number(form.quantity)) : 1,
        images: urls,
      };

      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create listing');

      // Trigger success popup dialog
      setCreatedListing(data);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Post an Item</h1>
          <p className="text-xs text-gray-500">List an item for sale, exchange, or giveaway to BAUST students.</p>
        </div>

        {/* AI Auto-Fill Button */}
        <button
          type="button"
          onClick={handleAiAutoFill}
          disabled={aiLoading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-sm transition-all disabled:opacity-60"
        >
          <Sparkles className="w-4 h-4" />
          {aiLoading ? 'AI Analyzing Photo...' : 'AI Auto-Fill with Photo (PRO)'}
        </button>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {aiSuccessMsg && <Alert type="success">{aiSuccessMsg}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <ImageUploader previews={previews} images={images} onRemove={removeImage} onAdd={handleImageChange} />

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Item Name *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Electrical Circuits by Boylestad 12th Ed"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Category *</label>
          <select
            required
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
          >
            <option value="">Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-gray-800">Description *</label>
          <textarea
            required
            value={form.description}
            rows={4}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Describe the condition, edition, specifications, or reason for selling..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 text-sm"
          />
        </div>

        <PostItemFields form={form} setForm={setForm} isFreeType={isFreeType} />

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-3 text-sm font-bold text-white bg-brand-600 rounded-xl hover:bg-brand-500 disabled:opacity-60 shadow-md transition-all flex items-center justify-center gap-2"
          >
            {submitting ? 'Publishing Item to Campus...' : 'Publish Item to BAUST Marketplace'}
          </button>
        </div>
      </form>

      {/* Success Dialog Modal */}
      {createdListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900">🎉 Item Posted Successfully!</h2>
              <p className="text-sm text-gray-600">
                Your listing is now live and visible to all BAUST students and campus community members.
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-left space-y-1 text-xs">
              <div className="font-semibold text-gray-800 text-sm truncate">
                {createdListing.title || form.title}
              </div>
              <div className="text-gray-500 font-mono">
                Listing ID: <span className="font-bold text-brand-700">{createdListing.customId || createdListing.id}</span>
              </div>
              <div className="text-emerald-700 font-medium">Status: Active & Searchable</div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/item/${createdListing.customId || createdListing.id}`)}
                className="w-full py-2.5 px-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> View Listing
              </button>

              <button
                type="button"
                onClick={() => router.push('/marketplace')}
                className="w-full py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <ShoppingBag className="w-4 h-4" /> Marketplace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
