'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

interface FirstLoginReminderModalProps {
  user?: {
    id: string;
    department?: string | null;
    studentId?: string | null;
    phone?: string | null;
    idCardStatus?: string | null;
    lastDailyLoginReminderAt?: Date | string | null;
  } | null;
}

export function FirstLoginReminderModal({ user }: FirstLoginReminderModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Check if profile or verification is incomplete
    const isProfileIncomplete = !user.department || !user.studentId || !user.phone;
    const isVerificationIncomplete = user.idCardStatus !== 'approved';

    if (!isProfileIncomplete && !isVerificationIncomplete) {
      // Everything is complete! No reminder needed.
      return;
    }

    // Check if reminder was already shown or dismissed today
    if (user.lastDailyLoginReminderAt) {
      const lastShown = new Date(user.lastDailyLoginReminderAt).toDateString();
      const today = new Date().toDateString();
      if (lastShown === today) {
        return;
      }
    }

    // Also check localStorage as an additional safeguard for client-side navigation
    const localLast = localStorage.getItem(`daily_reminder_${user.id}`);
    if (localLast === new Date().toDateString()) {
      return;
    }

    // Open reminder modal
    setIsOpen(true);
  }, [user]);

  const handleDismiss = async () => {
    if (user?.id) {
      localStorage.setItem(`daily_reminder_${user.id}`, new Date().toDateString());
    }
    setIsOpen(false);
    try {
      await fetch('/api/profile/daily-reminder-dismiss', { method: 'POST' });
    } catch (e) {
      // quiet fallback
    }
  };

  const handleGoToProfile = async () => {
    await handleDismiss();
    router.push('/profile');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden p-6 sm:p-7">
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-brand-50 text-brand-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">BAUST Account Setup</h3>
            <p className="text-xs text-gray-500">First daily login reminder</p>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          Welcome to BAUST Exchange! To buy, sell, exchange and access trusted campus deals, please make sure your student profile and BAUST ID verification are completed.
        </p>

        <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-1.5 mb-6">
          <div className="flex items-center gap-2">
            <span className={user?.studentId && user?.department ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {user?.studentId && user?.department ? '✓' : '•'}
            </span>
            <span>Department & Student ID {user?.studentId && user?.department ? 'Complete' : 'Pending'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={user?.idCardStatus === 'approved' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
              {user?.idCardStatus === 'approved' ? '✓' : '•'}
            </span>
            <span>
              BAUST Verified Seller Badge:{' '}
              {user?.idCardStatus === 'approved'
                ? 'Approved'
                : user?.idCardStatus === 'pending'
                ? 'Pending Review'
                : 'Not Submitted'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleGoToProfile}
            className="w-full sm:flex-1 py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl text-sm shadow-xs transition-colors inline-flex items-center justify-center gap-2"
          >
            <span>Complete Profile</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleDismiss}
            className="w-full sm:w-auto py-2.5 px-4 border border-gray-300 text-gray-700 hover:bg-gray-100 font-medium rounded-xl text-sm transition-colors"
          >
            Remind Me Tomorrow
          </button>
        </div>
      </div>
    </div>
  );
}
