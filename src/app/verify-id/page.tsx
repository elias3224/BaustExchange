import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Legacy /verify-id route.
 * Bypassed directly to /dashboard as verification is no longer a separate onboarding step.
 */
export default function VerifyIdRedirect() {
  redirect('/dashboard');
}
