'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('a');
      if (
        target &&
        target.href &&
        target.href.startsWith(window.location.origin) &&
        target.target !== '_blank'
      ) {
        const targetUrl = new URL(target.href);
        if (targetUrl.pathname !== window.location.pathname || targetUrl.search !== window.location.search) {
          setLoading(true);
        }
      }
    };

    document.addEventListener('click', handleAnchorClick);
    return () => {
      document.removeEventListener('click', handleAnchorClick);
    };
  }, [pathname, searchParams]);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-emerald-100 overflow-hidden">
      <div className="h-full bg-emerald-600 animate-pulse w-full origin-left transition-all duration-300" />
    </div>
  );
}

