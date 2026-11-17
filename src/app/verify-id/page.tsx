import { redirect } from 'next/navigation';

/**
 * Legacy /verify-id route.
 * Bypassed directly to /dashboard as verification is no longer a separate onboarding step.
 */
export default function VerifyIdRedirect() {
  redirect('/dashboard');
}
