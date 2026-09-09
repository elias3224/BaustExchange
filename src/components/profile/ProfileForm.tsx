'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { DEPARTMENTS } from '@/lib/utils';

export function ProfileForm({ initial }: { initial: { department: string; studentId: string; phone: string } }) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccess('Profile updated!');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-md bg-white p-6 space-y-5">
      <h2 className="text-lg font-semibold">Editable Details</h2>
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      <div>
        <label className="block text-sm font-medium mb-1">Department</label>
        <select
          value={form.department}
          onChange={(e) => setForm({ ...form, department: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        >
          <option value="">Not specified</option>
          {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <p className="text-xs text-gray-400 mt-1">Shown next to your listings so buyers can find items from their department.</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Student ID</label>
        <input
          type="text" value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          placeholder="e.g. 2103XXX"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Phone</label>
        <input
          type="tel" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="e.g. 017XXXXXXXX"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <p className="text-xs text-gray-400 mt-1">Only visible to users you message with.</p>
      </div>

      <button
        type="submit" disabled={saving}
        className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </form>
  );
}