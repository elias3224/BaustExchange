'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { DEPARTMENTS } from '@/lib/utils';
import { GraduationCap, Award, Upload, Trash2, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ProfileFormProps {
  initial: {
    department: string;
    studentId: string;
    phone: string;
    role?: string;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    department: initial.department || '',
    studentId: initial.studentId || '',
    phone: initial.phone || '',
    role: initial.role || 'student',
  });

  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        return setError('Please select a valid image file (JPG, PNG, WEBP).');
      }
      setIdCardFile(file);
      setIdCardPreview(URL.createObjectURL(file));
      setError('');
    }
  }

  function removeIdCard() {
    setIdCardFile(null);
    setIdCardPreview(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let uploadedIdCardUrl = '';
      if (idCardFile) {
        const fd = new FormData();
        fd.append('file', idCardFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload ID Card');
        uploadedIdCardUrl = uploadData.url;
      }

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(uploadedIdCardUrl ? { idCardUrl: uploadedIdCardUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');
      setSuccess('Profile details updated successfully!');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border border-gray-200 rounded-xl bg-white p-4 sm:p-6 space-y-6 shadow-2xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h2 className="text-lg font-bold text-gray-900">Editable Profile Details</h2>
        <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5" /> BAUST Verified
        </span>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Role Selection (Stacks Vertically on Mobile) */}
      <div>
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
          Campus Role Selection
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'student' })}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              form.role === 'student'
                ? 'border-brand-500 bg-brand-50/60 shadow-xs'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${form.role === 'student' ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                <span>Student</span>
                {form.role === 'student' && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">BAUST Undergrad / Graduate Student</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setForm({ ...form, role: 'teacher' })}
            className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
              form.role === 'teacher'
                ? 'border-brand-500 bg-brand-50/60 shadow-xs'
                : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className={`p-2.5 rounded-lg shrink-0 ${form.role === 'teacher' ? 'bg-brand-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
              <Award className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-gray-900 flex items-center justify-between">
                <span>Teacher / Faculty</span>
                {form.role === 'teacher' && <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Faculty Member / Academic Staff</p>
            </div>
          </button>
        </div>
      </div>

      {/* ID Card Upload Section */}
      <div className="space-y-2">
        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
          BAUST ID Card Verification (Optional / Renewal)
        </label>
        
        {idCardPreview ? (
          <div className="space-y-3">
            <div className="relative w-full max-w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-gray-300 bg-gray-100 flex items-center justify-center shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={idCardPreview}
                alt="ID Card Preview"
                className="w-full h-full object-contain p-2 max-w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm cursor-pointer min-h-[44px]">
                <RefreshCw className="w-4 h-4" /> Re-upload Image
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIdCardChange}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={removeIdCard}
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-sm inline-flex items-center gap-1.5 min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-xl bg-gray-50 hover:bg-gray-100/80 cursor-pointer transition-colors text-center">
            <Upload className="w-8 h-8 text-brand-500 mb-2" />
            <span className="text-sm font-bold text-gray-800">Upload BAUST Student / Teacher ID Card</span>
            <span className="text-xs text-gray-500 mt-1">Tap to select photo from camera or gallery (PNG, JPG)</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleIdCardChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Form Fields with Comfortable Touch Targets */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Department</label>
          <select
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            className="w-full px-3.5 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
          >
            <option value="">Select Department</option>
            {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <p className="text-xs text-gray-400 mt-1">Shown next to your listings so buyers can find items from their department.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            {form.role === 'teacher' ? 'Teacher / Employee ID' : 'Student ID'}
          </label>
          <input
            type="text"
            value={form.studentId}
            onChange={(e) => setForm({ ...form, studentId: e.target.value })}
            placeholder={form.role === 'teacher' ? 'e.g. EMP-1042' : 'e.g. 2103XXX'}
            className="w-full px-3.5 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Phone Number</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="e.g. 017XXXXXXXX"
            className="w-full px-3.5 py-3 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 min-h-[44px]"
          />
          <p className="text-xs text-gray-400 mt-1">Only visible to users you communicate with on accepted requests.</p>
        </div>
      </div>

      {/* Full-width One-hand Friendly Submit Button */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 px-6 text-sm font-bold text-white bg-brand-500 hover:bg-brand-600 active:bg-brand-700 rounded-xl shadow-xs transition-all disabled:opacity-60 min-h-[44px]"
      >
        {saving ? 'Saving Details…' : 'Save Changes'}
      </button>
    </form>
  );
}