'use client';

import { useEffect } from 'react';
import { signOut } from 'next-auth/react';

// The /auth/logout route simply signs the user out and returns to the landing page.
export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: '/' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Signing you out…</p>
    </div>
  );
}
