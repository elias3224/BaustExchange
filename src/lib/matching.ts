import prisma from '@/lib/prisma';
import { Listing, WantedItem, Category } from '@prisma/client';

/**
 * Very simple keyword-based matching between a listing and wanted items,
 * and between two users' exchange-for wishes.
 *
 * Per the spec this is NOT AI - it is basic database/keyword matching.
 */

/**
 * Extract normalised keywords from a string: lowercase, letters/digits only.
 */
function keywords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);
}

/**
 * Compute a simple keyword-overlap score between a listing and a wanted item.
 * Returns 0 when there is no overlap.
 */
export function matchScore(listing: {
  title: string;
  description?: string;
  category?: { name: string };
}, wanted: {
  title: string;
  description?: string;
  category?: { name: string };
}): number {
  const a = new Set([
    ...keywords(listing.title),
    ...keywords(listing.description ?? ''),
    ...keywords(listing.category?.name ?? ''),
  ]);
  const b = new Set([
    ...keywords(wanted.title),
    ...keywords(wanted.description ?? ''),
    ...keywords(wanted.category?.name ?? ''),
  ]);

  let overlap = 0;
  a.forEach((w) => {
    if (b.has(w)) overlap++;
  });
  return overlap;
}

/**
 * Find wanted items that match a given listing (by category or keywords).
 * Returns at most `limit` matches.
 */
export async function findMatchesForListing(
  listing: Partial<Listing> & { images?: any[] },
  limit = 8
) {
  const kw = keywords(`${listing.title || ''} ${listing.description || ''}`);
  const where: any = {
    status: 'active',
    OR: [
      { categoryId: listing.categoryId },
      ...(kw.length ? [{ title: { contains: kw[0] } }] : []),
    ],
  };

  const matches = await prisma.wantedItem.findMany({
    where,
    include: { category: true, user: true },
    take: limit,
  });

  return matches
    .map((m) => ({
      wanted: m,
      score: matchScore(
        { title: listing.title || '', description: listing.description || '', category: m.category },
        { title: m.title, description: m.description || '' }
      ),
    }))
    .sort((x, y) => y.score - x.score)
    .filter((m) => m.score > 0)
    .map((m) => m.wanted);
}

/**
 * Find people who might want to exchange with a listing owner.
 */
export async function findExchangePartners(listing: Listing, limit = 8) {
  if (!listing.exchangeFor) return [];
  const kw = keywords(listing.exchangeFor);

  const where: any = {
    status: 'active',
    NOT: { userId: listing.userId },
    AND: [{ transactionType: { in: ['exchange', 'sell_or_exchange'] } }],
    OR: [
      { exchangeFor: { not: null } },
      ...(kw.length ? [{ title: { contains: kw[0] } }] : []),
    ],
  };

  const results = await prisma.listing.findMany({
    where,
    include: { user: true, category: true, images: { take: 1 } },
    take: limit,
  });

  return results
    .map((l) => ({
      listing: l,
      score: matchScore(
        { title: l.exchangeFor || '' },
        { title: listing.exchangeFor || '' }
      ),
    }))
    .sort((x, y) => y.score - x.score)
    .filter((m) => m.score > 0)
    .map((m) => m.listing);
}
