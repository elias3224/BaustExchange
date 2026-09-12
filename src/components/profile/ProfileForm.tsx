'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { DEPARTMENTS } from '@/lib/utils';
import { verifyIdCardImage } from '@/lib/idCardVerify';
import {
  GraduationCap,
  Award,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Eye,
  EyeOff,
  Loader2,
  FileCheck,
  User,
} from 'lucide-react';

interface ProfileFormProps {
  initial: {
    department: string;
    studentId: string;
    phone: string;
    role?: string;
    isVerifiedSeller?: boolean;
    image?: string;
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

  // Profile Avatar State
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.image || null);

  // BAUST ID Card Verification State
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    verified: boolean;
    confidence: number;
    message: string;
  } | null>(
    initial.isVerifiedSeller
      ? { verified: true, confidence: 99, message: 'BAUST Official ID Verified' }
      : null
  );

  const [showSample, setShowSample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Avatar Change
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return setError('Please select a valid image for profile picture.');
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError('');
  }

  // Handle ID Card Change
  function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return setError('Please select a valid image file (JPG, PNG, WEBP).');
    }

    setError('');
    setIdCardFile(file);
    const previewUrl = URL.createObjectURL(file);
    setIdCardPreview(previewUrl);

    // Strict BAUST ID Verification — runs real OCR, rejects any random photo.
    setVerifying(true);
    setVerificationResult(null);

    verifyIdCardImage(file, form.role === 'teacher' ? 'teacher' : 'student')
      .then(setVerificationResult)
      .catch(() =>
        setVerificationResult({
          verified: false,
          confidence: 30,
          message:
            'Could not read the image. Please upload a brighter, sharper photo of your BAUST ID Card.',
        })
      )
      .finally(() => setVerifying(false));
  }

  function removeIdCard() {
    setIdCardFile(null);
    setIdCardPreview(null);
    setVerificationResult(
      initial.isVerifiedSeller
        ? { verified: true, confidence: 99, message: 'BAUST Official ID Verified' }
        : null
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      let uploadedAvatarUrl = '';
      if (avatarFile) {
        const fd = new FormData();
        fd.append('file', avatarFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Failed to upload profile picture');
        uploadedAvatarUrl = uploadData.url;
      }

      // NOTE: the ID card image itself is stored by /api/profile/verify-id
      // below (along with the admin-review status), not by /api/upload.

      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          ...(uploadedAvatarUrl ? { image: uploadedAvatarUrl } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update profile');

      // If a new ID card photo was uploaded, send it to the server
      // verification endpoint regardless of the client OCR verdict — the
      // server re-runs OCR and queues the card for admin review.
      // isVerifiedSeller is only granted by an admin afterwards.
      if (idCardFile) {
        const fd = new FormData();
        fd.append('file', idCardFile);
        fd.append('role', form.role === 'teacher' ? 'teacher' : 'student');
        const verifyRes = await fetch('/api/profile/verify-id', { method: 'POST', body: fd });
        if (!verifyRes.ok) {
          const verifyData = await verifyRes.json().catch(() => ({}));
          throw new Error(verifyData.error || 'ID card submission failed. Please try again.');
        }
        setSuccess('Profile saved. ID card submitted — awaiting admin review!');
      } else {
        setSuccess('Profile details saved successfully!');
      }
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
        <h2 className="text-lg font-bold text-gray-900">Editable Profile & Verification</h2>
        {verificationResult?.verified ? (
          <span className="text-xs text-emerald-700 font-bold bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
            <ShieldCheck className="w-4 h-4" /> BAUST Verified Member
          </span>
        ) : (
          <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-full">
            Verification Pending
          </span>
        )}
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Profile Picture Upload */}
      <div className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-brand-500 bg-gray-200 shrink-0">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
          ) : (
            <User className="w-full h-full p-3 text-gray-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
            Profile Photo
          </label>
          <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors shadow-2xs">
            <Upload className="w-3.5 h-3.5" /> Change Photo
            <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
          </label>
        </div>
      </div>

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

      {/* BAUST ID Card Verification Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
            BAUST Student / Teacher ID Card Verification
          </label>
          <button
            type="button"
            onClick={() => setShowSample((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
          >
            {showSample ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showSample ? 'Hide Sample ID Card' : 'View Sample BAUST ID Card'}
          </button>
        </div>

        {/* Sample ID Card Preview Container */}
        {showSample && (
          <div className="p-3.5 bg-gray-50 border border-brand-200 rounded-xl space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-brand-600" /> Official BAUST Sample ID Card Template
              </span>
              <span className="text-[11px] text-gray-500 font-medium">Verify logo, text & format</span>
            </div>
            <div className="relative w-full h-52 sm:h-64 rounded-lg overflow-hidden border border-gray-300 bg-white flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/sample-id-card.jpg"
                alt="Sample BAUST ID Card"
                className="w-full h-full object-contain p-1"
              />
            </div>
            <p className="text-[11px] text-gray-500 italic">
              Make sure your uploaded ID Card photo clearly displays the BAUST header logo and your Student/Teacher ID number.
            </p>
          </div>
        )}

        {/* Uploaded Card Preview & Verification Result */}
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

            {/* Verification Status Banner */}
            {verifying ? (
              <div className="p-3 bg-brand-50 border border-brand-200 text-brand-800 text-xs rounded-xl flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600 shrink-0" />
                <span>Scanning ID Card & verifying BAUST credentials...</span>
              </div>
            ) : verificationResult ? (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  verificationResult.verified
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-amber-50 border-amber-300 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {verificationResult.verified ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold block">{verificationResult.message}</span>
                    <span className="text-[11px] text-gray-600">
                      BAUST Format Match: {verificationResult.confidence}%
                    </span>
                  </div>
                </div>
                {verificationResult.verified && (
                  <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg text-[11px] shrink-0">
                    VERIFIED
                  </span>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2">
              <label className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-sm cursor-pointer min-h-[44px] transition-colors">
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
                className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-sm inline-flex items-center gap-1.5 min-h-[44px] transition-colors"
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
        {saving ? 'Saving Details & Verification…' : 'Save Changes'}
      </button>
    </form>
  );
}