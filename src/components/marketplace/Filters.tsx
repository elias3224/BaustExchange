import Link from 'next/link';
import { Search } from 'lucide-react';
import { CONDITION_LABELS, TRANSACTION_LABELS } from '@/lib/utils';

const CONDITIONS = ['new', 'like_new', 'good', 'used', 'damaged'] as const;
const TRANSACTIONS = ['sell', 'exchange', 'give_away', 'sell_or_exchange'] as const;

interface CategoryOpt { id: string; name: string; slug: string }
interface Params {
  q: string;
  category: string;
  condition: string;
  transactionType: string;
  minPrice: string;
  maxPrice: string;
  department: string;
  page: number;
}

export function FiltersForm({ categories, params }: { categories: CategoryOpt[]; params: Params }) {
  const { category, condition, transactionType, minPrice, maxPrice, department } = params;

  function buildUrl(updates: Record<string, string>) {
    const sp = new URLSearchParams();
    const cur: Record<string, string> = {
      q: params.q,
      category,
      condition,
      transactionType,
      minPrice,
      maxPrice,
      department,
    };

    // Toggle behavior: if clicking the active filter pill, remove it
    Object.keys(updates).forEach((key) => {
      if (cur[key] === updates[key]) {
        cur[key] = '';
      } else {
        cur[key] = updates[key];
      }
    });

    Object.keys(cur).forEach((k) => {
      if (cur[k]) sp.set(k, cur[k]);
    });
    return `/marketplace${sp.toString() ? `?${sp.toString()}` : ''}`;
  }

  return (
    <form action="/marketplace" method="get" className="w-full bg-white p-4 sm:p-5 border border-gray-200 rounded-lg shadow-sm space-y-4">
      {/* Hidden fields to preserve pill filters when submitting form */}
      {category && <input type="hidden" name="category" value={category} />}
      {condition && <input type="hidden" name="condition" value={condition} />}
      {transactionType && <input type="hidden" name="transactionType" value={transactionType} />}

      {/* Search Input */}
      <div className="relative w-full">
        <input
          type="text"
          name="q"
          defaultValue={params.q}
          placeholder="Search by item name, description..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </div>

      {/* Category Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={buildUrl({ category: c.slug })}
              className={`px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md border transition-colors ${
                category === c.slug
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Condition Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Condition</label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Link
              key={c}
              href={buildUrl({ condition: c })}
              className={`px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md border transition-colors ${
                condition === c
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {CONDITION_LABELS[c]}
            </Link>
          ))}
        </div>
      </div>

      {/* Transaction Type Pills */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Transaction Type</label>
        <div className="flex flex-wrap gap-2">
          {TRANSACTIONS.map((t) => (
            <Link
              key={t}
              href={buildUrl({ transactionType: t })}
              className={`px-3 py-1.5 sm:py-1 text-xs sm:text-sm font-medium rounded-md border transition-colors ${
                transactionType === t
                  ? 'bg-brand-500 text-white border-brand-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
              }`}
            >
              {TRANSACTION_LABELS[t]}
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Controls Row: Price Range, Department, Apply/Reset */}
      <div className="flex flex-wrap items-end gap-4 pt-2 border-t border-gray-100">
        <div className="w-full sm:w-auto">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Price Range (৳)</label>
          <div className="flex items-center gap-2 w-full">
            <input
              type="number"
              name="minPrice"
              defaultValue={minPrice}
              placeholder="Min"
              min="0"
              className="flex-1 sm:w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]"
            />
            <span className="text-gray-400 font-medium">—</span>
            <input
              type="number"
              name="maxPrice"
              defaultValue={maxPrice}
              placeholder="Max"
              min="0"
              className="flex-1 sm:w-28 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]"
            />
          </div>
        </div>

        <div className="w-full sm:w-64">
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Department</label>
          <input
            type="text"
            name="department"
            defaultValue={department}
            placeholder="e.g. CSE"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-500 min-h-[44px]"
          />
        </div>

        <div className="flex items-center gap-2.5 pt-1 sm:pt-0 w-full sm:w-auto">
          <button
            type="submit"
            className="flex-1 sm:flex-initial px-5 py-2.5 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 active:bg-brand-700 transition-colors shadow-xs text-center min-h-[44px]"
          >
            Apply Filters
          </button>
          <Link
            href="/marketplace"
            className="flex-1 sm:flex-initial px-4 py-2.5 text-sm font-semibold text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-center min-h-[44px]"
          >
            Reset
          </Link>
        </div>
      </div>
    </form>
  );
}
