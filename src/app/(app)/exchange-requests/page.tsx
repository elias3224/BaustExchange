// src/app/(app)/exchange-requests/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { EmptyState } from '@/components/ui/EmptyState';
import { RequestCard } from '@/components/requests/RequestCard';
import { RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ExchangeRequestsPage() {
  const user = await currentUser();
  if (!user) return null;

  const [incoming, outgoing] = await Promise.all([
    prisma.exchangeRequest.findMany({
      where: { receiverId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { images: { take: 1 } } },
        sender: { select: { id: true, name: true, image: true, role: true } },
        receiver: { select: { id: true, name: true } },
      },
    }),
    prisma.exchangeRequest.findMany({
      where: { senderId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: { include: { images: { take: 1 } } },
        sender: { select: { id: true, name: true } },
        receiver: { select: { id: true, name: true, image: true, role: true } },
      },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Exchange Requests</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Incoming ({incoming.length})</h2>
        {incoming.length === 0 ? (
          <EmptyState
            icon={<RefreshCw className="w-10 h-10" />}
            title="No incoming requests"
            description="When someone requests one of your items, it will appear here."
          />
        ) : (
          <div className="space-y-3">
            {incoming.map((r) => (
              <RequestCard key={r.id} request={r as any} direction="incoming" />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Outgoing ({outgoing.length})</h2>
        {outgoing.length === 0 ? (
          <EmptyState
            title="No outgoing requests"
            description="Browse the marketplace and request items you like."
            action={<a href="/marketplace" className="text-sm text-brand-600 hover:underline">Browse marketplace</a>}
          />
        ) : (
          <div className="space-y-3">
            {outgoing.map((r) => (
              <RequestCard key={r.id} request={r as any} direction="outgoing" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}