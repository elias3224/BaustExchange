'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ShieldCheck, GraduationCap, Award, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

export default function SelectRolePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const user = session?.user as any;

  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher'>('student');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    } else if (status === 'authenticated') {
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else if (user?.hasSelectedRole) {
        router.replace('/dashboard');
      }
    }
  }, [status, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/auth/set-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save role');

      // Refresh session & redirect
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (status === 'loading') {
    return (
      <div className="h-screen w-screen bg-gray-900 flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-gray-900 flex items-center justify-center p-4 font-sans select-none overflow-y-auto">
      {/* Background Campus Overlay */}
      <Image
        src="/images/campus.jpeg"
        alt="BAUST Campus"
        fill
        priority
        sizes="100vw"
        quality={75}
        className="object-cover object-center opacity-25 -z-10"
      />

      <div className="bg-gray-800/95 border border-gray-700 shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md text-white relative z-10 space-y-6 my-auto">
        {/* Header */}
        <div className="text-center space-y-2 border-b border-gray-700 pb-4">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl mb-1 border border-emerald-500/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-emerald-400 tracking-tight">
            Select Your Campus Role
          </h1>
          <p className="text-xs text-gray-300 max-w-xs mx-auto leading-relaxed">
            One-Time Setup: Choose your BAUST identity role to continue to your dashboard.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        {/* Role Cards */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-3">
            <button
              type="button"
              onClick={() => setSelectedRole('student')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                selectedRole === 'student'
                  ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md'
                  : 'border-gray-700 bg-gray-900/40 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${selectedRole === 'student' ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Student</span>
                  {selectedRole === 'student' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <span className="text-xs text-gray-300 block mt-0.5">BAUST Undergraduate / Graduate Student</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('teacher')}
              className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer text-left ${
                selectedRole === 'teacher'
                  ? 'border-emerald-400 bg-emerald-500/20 text-white shadow-md'
                  : 'border-gray-700 bg-gray-900/40 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              <div className={`p-3 rounded-xl shrink-0 ${selectedRole === 'teacher' ? 'bg-emerald-500 text-gray-950' : 'bg-gray-800 text-gray-400'}`}>
                <Award className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">Teacher / Faculty</span>
                  {selectedRole === 'teacher' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                </div>
                <span className="text-xs text-gray-300 block mt-0.5">Faculty Member / Academic Staff</span>
              </div>
            </button>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 px-6 text-sm font-bold text-gray-950 bg-emerald-400 hover:bg-emerald-300 active:bg-emerald-500 rounded-xl shadow-lg transition-all min-h-[44px] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Role to Account...
              </>
            ) : (
              <>
                Save Role & Continue <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

