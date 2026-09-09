import Link from 'next/link';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { LayoutDashboard, ShoppingCart, RefreshCw, CheckCircle, Package, Plus } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCard } from '@/components/marketplace/ListingCard';

function StatCard({ title, value, icon, href }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const base = 'flex items-center gap-3 sm:gap-4 p-4 sm:p-5 bg-white border border-gray-200 rounded-xl shadow-xs transition-all duration-150';
  const content = (
    <>
      <div className="text-2xl text-brand-500 shrink-0 p-2.5 bg-brand-50 rounded-lg">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{value}</div>
        <div className="text-xs sm:text-sm text-gray-500 font-medium truncate">{title}</div>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={`${base} hover:border-brand-300 hover:shadow-sm active:bg-gray-50`}>{content}</Link>
  ) : (
    <div className={base}>{content}</div>
  );
}

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) return null;

  const [myListings, incoming, outgoing, completed, recentListings, recentRequests, wantedItems] =
    await Promise.all([
      prisma.listing.count({ where: { userId: user.id, status: { in: ['active', 'pending', 'sold', 'exchanged', 'given'] } } }),
      prisma.exchangeRequest.count({ where: { receiverId: user.id, status: 'pending' } }),
      prisma.exchangeRequest.count({ where: { senderId: user.id, status: 'pending' } }),
      prisma.exchangeRequest.count({ where: { OR: [{ senderId: user.id }, { receiverId: user.id }], status: 'completed' } }),
      prisma.listing.findMany({
        where: { userId: user.id, status: { in: ['active', 'pending', 'sold', 'exchanged', 'given'] } },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { category: true, images: { take: 1 }, user: { select: { id: true, name: true, image: true, role: true, department: true } } },
      }),
      prisma.exchangeRequest.findMany({
        where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { listing: { include: { images: { take: 1 } } }, sender: true, receiver: true },
      }),
      prisma.wantedItem.findMany({
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { category: true, user: { select: { id: true, name: true, role: true, department: true } } },
      }),
    ]);

  const typedListings = recentListings as any[];
  const typedRequests = recentRequests as any[];
  const typedWanted = wantedItems as any[];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 tracking-tight">Dashboard</h1>
        <Link
          href="/post-item"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 active:bg-brand-700 shadow-xs transition-all text-sm min-h-[44px]"
        >
          <Package className="w-4 h-4" /> Quick Post Item
        </Link>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title="My Listings" value={myListings} icon={<LayoutDashboard className="w-5 h-5 sm:w-6 sm:h-6" />} href="/my-listings" />
        <StatCard title="Incoming Requests" value={incoming} icon={<ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />} href="/exchange-requests" />
        <StatCard title="Outgoing Requests" value={outgoing} icon={<RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />} href="/exchange-requests" />
        <StatCard title="Completed Exchanges" value={completed} icon={<CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />} href="/exchange-requests" />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Listings</h2>
          <Link href="/my-listings" className="text-xs sm:text-sm font-semibold text-brand-600 hover:underline">
            View All &rarr;
          </Link>
        </div>
        {typedListings.length === 0 ? (
          <EmptyState
            title="No listings yet"
            description="You haven't posted anything yet."
            action={
              <Link href="/post-item" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-brand-500 rounded-lg hover:bg-brand-600 mt-2">
                <Plus className="w-4 h-4" /> Post your first item
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {typedListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Recent Requests</h2>
          <Link href="/exchange-requests" className="text-xs sm:text-sm font-semibold text-brand-600 hover:underline">
            View Requests &rarr;
          </Link>
        </div>
        {typedRequests.length === 0 ? (
          <EmptyState title="No exchange requests yet" />
        ) : (
          <div className="space-y-2">
            {typedRequests.map((r) => {
              const other = r.senderId === user.id ? r.receiver : r.sender;
              const row = (
                <>
                  <div className="text-sm font-semibold text-gray-900 flex flex-wrap items-center gap-1">
                    <span>{r.senderId === user.id ? 'You' : other?.name ?? 'Someone'}</span>
                    <span className="text-brand-600">{r.senderId === user.id ? ' →' : ' → you'}</span>
                    <span className="truncate max-w-[200px] sm:max-w-md">{r.listing?.title ?? ''}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{r.message}</div>
                </>
              );
              const rowClass =
                'block p-3 sm:p-4 border border-gray-200 rounded-xl bg-white hover:border-gray-300 active:bg-gray-50 transition-all shadow-2xs';
              // If the listing was deleted, render a plain row (no broken /item/ link).
              return r.listing?.id ? (
                <Link key={r.id} href={`/item/${r.listing.id}`} className={rowClass}>
                  {row}
                </Link>
              ) : (
                <div key={r.id} className={rowClass}>
                  {row}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Active Wanted Items</h2>
          <Link href="/wanted" className="text-xs sm:text-sm font-semibold text-brand-600 hover:underline">
            Explore Wanted &rarr;
          </Link>
        </div>
        {typedWanted.length === 0 ? (
          <EmptyState title="No wanted items available." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {typedWanted.map((w) => (
              <div key={w.id} className="p-3.5 border border-gray-200 rounded-xl bg-white shadow-2xs space-y-1">
                <div className="font-semibold text-sm text-gray-900 truncate">{w.title}</div>
                <div className="text-xs text-gray-500 font-medium">{w.category.name}</div>
                {w.budget && <div className="text-xs font-bold text-emerald-600">Budget: ৳{w.budget}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
