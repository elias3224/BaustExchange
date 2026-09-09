import Link from 'next/link';

type FilterParams = Record<string, string | number>;

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

  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={href(p)}
          className={`px-3 py-1 rounded-md text-sm ${
            p === current
              ? 'bg-brand-500 text-white'
              : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
