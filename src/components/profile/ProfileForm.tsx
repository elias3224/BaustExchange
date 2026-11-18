'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Alert } from '@/components/ui/Alert';
import { DEPARTMENTS } from '@/lib/utils';
import { useFormDraft } from '@/hooks/useFormDraft';
import {
  GraduationCap,
  Upload,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  User,
  Phone,
  BookOpen,
  Calendar,
  FileText,
  Clock,
  XCircle,
  Edit3,
  Loader2,
  ExternalLink,
} from 'lucide-react';

interface ProfileFormProps {
  initial: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    department?: string | null;
    studentId?: string | null;
    phone?: string | null;
    batch?: string | null;
    bio?: string | null;
    role?: string | null;
    isVerifiedSeller?: boolean;
    idCardStatus?: string | null;
    idCardUrl?: string | null;
    idCardRejectReason?: string | null;
  };
}

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();

  // Form State with persistence
  const {
    values: profileData,
    setValues: setProfileData,
    hasRestoredDraft,
    clearDraft,
    discardDraft,
  } = useFormDraft({
    formId: 'profile-edit',
    initialValues: {
      name: initial.name || '',
      department: initial.department || '',
      studentId: initial.studentId || '',
      phone: initial.phone || '',
      batch: initial.batch || '',
      bio: initial.bio || '',
    },
  });

  // Hidden by default; clicking "Edit Profile" toggles it open (or opens if draft restored)
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (hasRestoredDraft) {
      setIsEditing(true);
    }
  }, [hasRestoredDraft]);

  const name = profileData.name;
  const department = profileData.department;
  const studentId = profileData.studentId;
  const phone = profileData.phone;
  const batch = profileData.batch;
  const bio = profileData.bio;

  const setName = (val: string) => setProfileData((p) => ({ ...p, name: val }));
  const setDepartment = (val: string) => setProfileData((p) => ({ ...p, department: val }));
  const setStudentId = (val: string) => setProfileData((p) => ({ ...p, studentId: val }));
  const setPhone = (val: string) => setProfileData((p) => ({ ...p, phone: val }));
  const setBatch = (val: string) => setProfileData((p) => ({ ...p, batch: val }));
  const setBio = (val: string) => setProfileData((p) => ({ ...p, bio: val }));

  // BAUST ID Card Verification State
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>(initial.idCardStatus || 'none');
  const [verificationRejectReason, setVerificationRejectReason] = useState<string | null>(
    initial.idCardRejectReason || null
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handle Profile Details Save
  async function handleSubmitProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          department: department.trim() || null,
          studentId: studentId.trim() || null,
          phone: phone.trim() || null,
          batch: batch.trim() || null,
          bio: bio.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update profile');
      }

      clearDraft();
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Handle ID Card File Selection
  function handleIdCardChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      return setError('Please select a valid image (JPG, PNG, WEBP) or PDF file.');
    }

    if (file.size > 5 * 1024 * 1024) {
      return setError('File size must be under 5 MB.');
    }

    setError('');
    setIdCardFile(file);
    if (file.type.startsWith('image/')) {
      setIdCardPreview(URL.createObjectURL(file));
    } else {
      setIdCardPreview(null);
    }
  }

  // Handle Verification Request Submission to Admin
  async function handleVerificationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!idCardFile) {
      return setError('Please attach your BAUST Student ID card image or PDF.');
    }

    setSubmittingVerification(true);
    setError('');
    setSuccess('');

    try {
      const fd = new FormData();
      fd.append('file', idCardFile);
      if (studentId) fd.append('studentId', studentId.trim());
      if (department) fd.append('department', department.trim());
      if (initial.role) fd.append('role', initial.role);

      const res = await fetch('/api/profile/verify-id', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit verification request.');
      }

      setVerificationStatus('pending');
      setVerificationRejectReason(null);
      setSuccess('Verification request submitted! Administrators will review your ID card.');
      setIdCardFile(null);
      setIdCardPreview(null);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingVerification(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && <Alert type="error">{error}</Alert>}
      {success && <Alert type="success">{success}</Alert>}

      {/* Edit Profile Toggle Header */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-xs">
        <div>
          <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
          <p className="text-xs text-gray-500">Manage your student details, department, batch and bio</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsEditing((prev) => !prev);
            setError('');
            setSuccess('');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg transition-colors cursor-pointer"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>{isEditing ? 'Close Edit Form' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Profile Form (Hidden by default, opened by Edit Profile button) */}
      {isEditing && (
        <form
          onSubmit={handleSubmitProfile}
          className="p-5 sm:p-6 bg-white border border-brand-200 rounded-xl shadow-xs space-y-4 animate-in fade-in duration-200"
        >
          {hasRestoredDraft && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  <strong>Draft Restored:</strong> Restored unsaved profile edits from your previous session.
                </span>
              </div>
              <button
                type="button"
                onClick={discardDraft}
                className="text-blue-700 hover:text-blue-900 font-semibold underline shrink-0 ml-2"
              >
                Discard Draft
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <User className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Student ID</label>
              <div className="relative">
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="e.g. 210201044"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <GraduationCap className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
              <div className="relative">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <BookOpen className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Batch</label>
              <div className="relative">
                <input
                  type="text"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. 19th Batch / 2021-2025"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">Bio / About</label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short description about yourself or what items you usually trade..."
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
                <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* BAUST Official Verification Card */}
      <div className="p-5 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-gray-900">BAUST Identity Verification</h3>
          </div>
          {verificationStatus === 'approved' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> BAUST Verified
            </span>
          ) : verificationStatus === 'pending' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full">
              <Clock className="w-3.5 h-3.5" /> Verification Pending
            </span>
          ) : verificationStatus === 'rejected' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">
              <XCircle className="w-3.5 h-3.5" /> Rejected
            </span>
          ) : (
            <span className="text-xs text-gray-500 font-medium">Not Verified</span>
          )}
        </div>

        {verificationStatus === 'approved' ? (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Your official BAUST student/faculty credentials have been verified by administrators.
            </p>
            <p className="text-[11px] text-emerald-700">
              You possess the exclusive <strong>✓ BAUST Verified</strong> badge displayed across all your listings and profile.
            </p>
          </div>
        ) : verificationStatus === 'pending' ? (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1.5">
            <p className="font-semibold flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Your verification request has been submitted and is pending administrator review.
            </p>
            <p className="text-[11px] text-amber-700">
              Once an administrator inspects your submitted ID document, your verified seller badge will be activated automatically.
            </p>
            {initial.idCardUrl && (
              <a
                href={initial.idCardUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-brand-600 hover:underline pt-1"
              >
                <span>View Submitted ID Document</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        ) : (
          <form onSubmit={handleVerificationSubmit} className="space-y-4">
            {verificationStatus === 'rejected' && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-1">
                <p className="font-semibold flex items-center gap-1.5">
                  <XCircle className="w-4 h-4 text-red-600" />
                  Your previous verification was rejected:
                </p>
                <p className="text-red-700 font-medium">{verificationRejectReason || 'ID document was unclear or invalid.'}</p>
                <p className="text-[11px] text-gray-600">Please attach a clearer photo or PDF of your official BAUST Student ID card below.</p>
              </div>
            )}

            <p className="text-xs text-gray-600 leading-relaxed">
              Upload your official BAUST Student ID card (Image or PDF). Administrators will inspect your card and verify your student status.
            </p>

            <div className="border-2 border-dashed border-gray-300 hover:border-brand-400 rounded-xl p-4 sm:p-5 text-center transition-colors bg-gray-50/50">
              {idCardPreview ? (
                <div className="space-y-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={idCardPreview} alt="Selected ID Card" className="max-h-40 mx-auto rounded-lg object-contain shadow-xs" />
                  <p className="text-xs text-gray-600">{idCardFile?.name}</p>
                </div>
              ) : idCardFile ? (
                <div className="space-y-1">
                  <FileCheck className="w-8 h-8 text-brand-600 mx-auto" />
                  <p className="text-xs font-semibold text-gray-800">{idCardFile.name}</p>
                  <p className="text-[11px] text-gray-400">{(idCardFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                  <div>
                    <span className="text-xs font-bold text-brand-600 hover:underline">Click to upload ID Card</span>
                    <span className="text-xs text-gray-500"> or drag and drop</span>
                  </div>
                  <p className="text-[11px] text-gray-400">JPG, PNG, WEBP or PDF (Max 5 MB)</p>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleIdCardChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              disabled={submittingVerification || !idCardFile}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-xs transition-colors inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              {submittingVerification ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>Submit for Admin Verification</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
