'use client';

import { signIn, useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { ShieldCheck, ArrowLeft, Loader2 } from 'lucide-react';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');
  const { data: session, status } = useSession();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Safety fallback: Never keep user stuck on infinite spinner if session fetch fails or takes too long
  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    if (status !== 'loading') setShowContent(true);
    return () => clearTimeout(timer);
  }, [status]);

  // Automatically redirect authenticated users to their backend-assigned dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      const user = session?.user as any;
      if (user?.role === 'admin') {
        router.replace('/admin');
      } else if (user?.hasSelectedRole === false) {
        router.replace('/select-role');
      } else if (!user?.isVerifiedSeller) {
        router.replace('/verify-id');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [status, session, router]);

  function handleGoogleLogin() {
    setIsSigningIn(true);
    signIn('google', { callbackUrl }).catch(() => {
      setIsSigningIn(false);
    });
  }

  const getErrorMessage = (err: string) => {
    switch (err) {
      case 'Blocked':
        return 'Your account has been suspended or blocked by an administrator.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'OAuthCallback':
      case 'OAuthSignin':
      case 'OAuthCreateAccount':
        return 'Failed to complete Google authentication. Please try again.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  if (status === 'loading' && !showContent) {
    return (
      <div className="flex items-center justify-center p-8 text-white">
        <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="bg-gray-800/95 border border-gray-700 shadow-2xl rounded-2xl p-6 sm:p-8 w-full max-w-md text-center text-white relative z-10 space-y-6 my-auto">
      {/* Brand Header */}
      <div className="flex flex-col items-center">
        <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-700 shadow-md mb-3">
          <Image
            src="/images/campus.jpeg"
            alt="BAUST Campus"
            fill
            className="object-cover"
          />
        </div>
        <h1 className="text-2xl font-bold text-emerald-400 tracking-tight">
          BAUST <span className="text-white">Exchange</span>
        </h1>
        <p className="mt-1.5 text-xs text-gray-300 max-w-xs leading-relaxed">
          Sign in with your Google account to access the BAUST campus marketplace.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-900/50 border border-red-700 text-red-200 text-xs rounded-xl text-left">
          {getErrorMessage(error)}
        </div>
      )}

      {/* Google Sign In Button */}
      <div className="space-y-3 pt-2">
        <button
          onClick={handleGoogleLogin}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-gray-100 disabled:opacity-75 text-gray-800 font-bold rounded-xl border border-gray-200 shadow-lg transition-all duration-200 group active:scale-[0.99] min-h-[44px] cursor-pointer disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          ) : (
            <span className="flex items-center justify-center shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 group-hover:scale-110 transition-transform">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </span>
          )}
          <span>{isSigningIn ? 'Redirecting to Google...' : 'Continue with Google'}</span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Secure authentication with Google OAuth</span>
        </div>
      </div>

      <p className="pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
        <Link href="/" className="inline-flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative w-full min-h-screen overflow-y-auto bg-gray-900 flex items-center justify-center p-4 font-sans select-none">
      {/* Full Page Campus Background Image with dark opacity */}
      <Image
        src="/images/campus.jpeg"
        alt="BAUST Campus"
        fill
        priority
        sizes="100vw"
        quality={75}
        className="object-cover object-center opacity-30 -z-10"
      />

      <Suspense fallback={<div className="text-white text-sm">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
