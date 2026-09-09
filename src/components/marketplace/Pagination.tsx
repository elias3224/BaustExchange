import Link from 'next/link';

type FilterParams = Record<string, string | number>;

/**
 * Build a windowed page list so the bar never overflows on small screens:
 * [1, '…', 4, 5, 6, '…', 20]
 */
function pageWindow(current: number, pages: number): (number | 'ellipsis')[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items: (number | 'ellipsis')[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(pages - 1, current + 1);
  if (start > 2) items.push('ellipsis');
  for (let p = start; p <= end; p++) items.push(p);
  if (end < pages - 1) items.push('ellipsis');
  items.push(pages);
  return items;
}

export function Pagination({
  current,
  pages,
  params = {},
  basePath = '/marketplace',
}: {
  current: number;
  pages: number;
  params?: FilterParams;
  basePath?: string;
}) {
  if (pages <= 1) return null;

  function href(page: number) {
    const all: Record<string, string> = {};
    Object.entries(params).forEach(([k, v]) => {
      if (v !== '') all[k] = String(v);
    });
    if (page > 1) all.page = String(page);
    const sp = new URLSearchParams(all);
    const qs = sp.toString();
    return `${basePath}${qs ? `?${qs}` : ''}`;
  }

  const linkClass = (active: boolean) =>
    `flex h-10 min-w-[40px] items-center justify-center rounded-md px-2.5 text-sm font-medium transition-colors ${
      active
        ? 'bg-brand-500 text-white'
        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 active:bg-gray-200'
    }`;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
      {current > 1 && (
        <Link href={href(current - 1)} className={linkClass(false)} aria-label="Previous page">
          &larr;
        </Link>
      )}

      {pageWindow(current, pages).map((p, i) =>
        p === 'ellipsis' ? (
          <span key={`e-${i}`} className="px-1.5 py-1 text-sm text-gray-400 select-none">
            &hellip;
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={linkClass(p === current)}
            aria-current={p === current ? 'page' : undefined}
          >
            {p}
          </Link>
        )
      )}

      {current < pages && (
        <Link href={href(current + 1)} className={linkClass(false)} aria-label="Next page">
          &rarr;
        </Link>
      )}
    </nav>
  );
}
