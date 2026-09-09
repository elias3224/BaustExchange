import Link from 'next/link';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { LayoutDashboard, ShoppingCart, RefreshCw, CheckCircle, Package } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListingCard } from '@/components/marketplace/ListingCard';

function StatCard({ title, value, icon, href }: {
  title: string;
  value: number;
  icon: React.ReactNode;
  href?: string;
}) {
  const base = 'flex items-center gap-4 p-5 bg-white border border-gray-200 rounded-md';
  const content = (
    <>
      <div className="text-2xl text-brand-500">{icon}</div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-sm text-gray-500">{title}</div>
      </div>
    </>
  );
  return href ? (
    <Link href={href} className={`${base} hover:bg-gray-50`}>{content}</Link>
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="My Listings" value={myListings} icon={<LayoutDashboard />} href="/my-listings" />
        <StatCard title="Incoming Requests" value={incoming} icon={<ShoppingCart />} href="/exchange-requests" />
        <StatCard title="Outgoing Requests" value={outgoing} icon={<RefreshCw />} href="/exchange-requests" />
        <StatCard title="Completed Exchanges" value={completed} icon={<CheckCircle />} href="/exchange-requests" />
      </section>

      <div className="flex gap-2">
        <Link href="/post-item" className="inline-flex items-center gap-1 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600">
          <Package className="w-4 h-4" /> Quick Post Item
        </Link>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Listings</h2>
        {typedListings.length === 0 ? (
          <EmptyState title="No listings yet" description="You haven't posted anything yet."
            action={<Link href="/post-item" className="text-sm text-brand-600 hover:underline">Post your first item</Link>} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {typedListings.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Requests</h2>
        {typedRequests.length === 0 ? (
          <EmptyState title="No exchange requests yet" />
        ) : (
          <div className="space-y-2">
            {typedRequests.map((r) => {
              const other = r.senderId === user.id ? r.receiver : r.sender;
              return (
                <Link key={r.id} href={`/item/${r.listing?.id ?? ''}`} className="block p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                  <div className="text-sm font-medium">
                    {r.senderId === user.id ? 'You' : other?.name ?? 'Someone'}
                    {r.senderId === user.id ? ' →' : ' → you'} {r.listing?.title ?? ''}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{r.message.slice(0, 80)}{r.message.length > 80 && '…'}</div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Active Wanted Items</h2>
        {typedWanted.length === 0 ? (
          <EmptyState title="No wanted items available." />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {typedWanted.map((w) => (
              <div key={w.id} className="p-3 border border-gray-200 rounded-md bg-white">
                <div className="font-medium text-sm">{w.title}</div>
                <div className="text-xs text-gray-500">{w.category.name}</div>
                {w.budget && <div className="text-xs text-green-600">Budget: ৳{w.budget}</div>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
