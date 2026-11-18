'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export function GlobalBackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined') {
      // Check if there is internal history within the same origin
      const hasHistory =
        window.history.length > 1 &&
        document.referrer &&
        document.referrer.includes(window.location.host);

      if (hasHistory) {
        router.back();
      } else {
        // Fallback to Dashboard if direct entry or no in-app history
        router.push('/dashboard');
      }
    } else {
      router.back();
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      title="Go back"
      aria-label="Go back to previous page"
      className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200 text-gray-600 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 shadow-2xs hover:shadow-xs transition-all duration-200 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-blue-500/20"
    >
      <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
    </button>
  );
}
