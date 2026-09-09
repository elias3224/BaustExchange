// src/app/(app)/my-listings/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { EmptyState } from '@/components/ui/EmptyState';
import { MyListingCard } from '@/components/listings/MyListingCard';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function MyListingsPage() {
  const user = await currentUser();
  if (!user) return null;

  const listings = await prisma.listing.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { name: true } },
      images: { take: 1, orderBy: { order: 'asc' } },
      _count: { select: { requests: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">My Listings</h1>
        <Link
          href="/post-item"
          className="inline-flex items-center justify-center gap-1 px-4 py-2.5 sm:py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 active:bg-brand-700 text-sm min-h-[44px] sm:min-h-0"
        >
          <Plus className="w-4 h-4" /> Post New Item
        </Link>
      </div>

      {listings.length === 0 ? (
        <EmptyState
          title="You haven't posted anything yet"
          description="Items you post will show up here with their status."
          action={<Link href="/post-item" className="text-sm text-brand-600 hover:underline">Post your first item</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map((l) => <MyListingCard key={l.id} listing={l as any} />)}
        </div>
      )}
    </div>
  );
}