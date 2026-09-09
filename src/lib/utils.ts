import { formatDistanceToNow, format } from 'date-fns';

/**
 * Format a date as e.g. "Jan 2, 2025" or "just now".
 */
export function formatDate(date: Date | string): string {
  try {
    const d = new Date(date);
    return format(d, 'PP');
  } catch {
    return '';
  }
}

/**
 * Format a date as a relative string: "5 minutes ago".
 */
export function timeAgo(date: Date | string): string {
  try {
    const d = new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return '';
  }
}

/**
 * Convert a price float to a Bengali-taka currency string.
 */
export function formatPrice(price: number | null | undefined): string {
  if (price === null || price === undefined || price === 0) return '৳ 0';
  return `৳ ${price.toLocaleString('en-BD', { maximumFractionDigits: 2 })}`;
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(str: string): string {
  return str
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Capitalise the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Return the label for a ListingCondition enum value.
 */
export const CONDITION_LABELS: Record<string, string> = {
  new: 'New',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
  damaged: 'Damaged',
};

export const TRANSACTION_LABELS: Record<string, string> = {
  sell: 'Sell',
  exchange: 'Exchange',
  give_away: 'Give Away',
  sell_or_exchange: 'Sell or Exchange',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  active: 'Active',
  sold: 'Sold',
  exchanged: 'Exchanged',
  given: 'Given',
  rejected: 'Rejected',
  removed: 'Removed',
};

/**
 * The default categories used by the application.
 */
export const DEFAULT_CATEGORIES = [
  'Books',
  'Furniture',
  'Electronics',
  'Clothing',
  'Stationery',
  'Academic Materials',
  'Sports',
  'Accessories',
  'Others',
];

export const DEPARTMENTS = [
  'CSE',
  'EEE',
  'BBA',
  'LLB',
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Civil Engineering',
  'Mechanical Engineering',
  'Other',
];

export const REPORT_REASONS = [
  'Fake Listing',
  'Spam',
  'Wrong Information',
  'Offensive Content',
  'Suspicious User',
  'Other',
] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];
