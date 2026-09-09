import type { ReactNode } from 'react';

/**
 * Layout for public legal pages (/privacy, /terms, /privacy-policy, /terms-of-service).
 *
 * These pages intentionally live OUTSIDE the authenticated `(app)` group so that
 * guests coming from the landing-page footer can read them without being
 * redirected to /login. The middleware already whitelists these paths.
 */
export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen min-h-dvh bg-gray-50">
      {children}
    </div>
  );
}
