import Link from 'next/link';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { EmptyState } from '@/components/ui/EmptyState';
import { WantedForm } from '@/components/wanted/WantedForm';
import { MyWantedItem } from '@/components/wanted/MyWantedItem';
import { Heart, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function WantedPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await currentUser();
  if (!user) return null;

  const sp = await searchParams;
  const showForm = sp.new === 'true';
  const q = (sp.q as string) || '';

  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  if (showForm) {
    return <WantedForm categories={categories} />;
  }

  const whereOthers: any = { status: 'active', NOT: { userId: user.id } };
  if (q) {
    whereOthers.OR = [
      { title: { contains: q } },
      { description: { contains: q } },
    ];
  }

  const [items, myItems] = await Promise.all([
    prisma.wantedItem.findMany({
      where: whereOthers,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { category: true, user: { select: { id: true, name: true, role: true, department: true } } },
    }),
    prisma.wantedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: { category: true },
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Wanted Items</h1>
        <Link
          href="/post-wanted"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-brand-500 text-white rounded-md hover:bg-brand-600 text-sm font-medium shadow-sm shrink-0"
        >
          <Heart className="w-4 h-4 fill-white" /> Add Wanted Item
        </Link>
      </div>

      {/* Search Wanted Items */}
      <form action="/wanted" method="get" className="relative w-full max-w-md">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search wanted items by keyword..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
      </form>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">My Wanted Items</h2>
        {myItems.length === 0 ? (
          <EmptyState
            icon={<Heart className="w-10 h-10 text-gray-400" />}
            title="You haven't added any wanted items"
            description="Tell people what you are looking for and get notified on matches."
            action={<Link href="/post-wanted" className="text-sm text-brand-600 hover:underline">Add your first wanted item</Link>}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {myItems.map((w) => (
              <MyWantedItem key={w.id} item={w as any} categories={categories} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3 text-gray-800">What Others Are Looking For ({items.length})</h2>
        {items.length === 0 ? (
          <EmptyState title="No wanted items found matching your search." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((w) => (
              <div key={w.id} className="p-4 border border-gray-200 rounded-md bg-white flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm text-gray-800">{w.title}</h3>
                    {w.budget != null && (
                      <span className="text-xs text-green-700 font-semibold whitespace-nowrap bg-green-50 px-2 py-0.5 rounded border border-green-200">
                        up to ৳{w.budget}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{w.category.name}</div>
                  {w.description && (
                    <p className="text-xs text-gray-600 mt-2 line-clamp-3">{w.description}</p>
                  )}
                </div>

                <div className="pt-3 mt-3 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500 truncate">
                    <span className="font-medium text-gray-700">{w.user.name}</span>
                    {w.user.department && <span className="text-gray-400"> ({w.user.department})</span>}
                  </div>
                  <Link
                    href={`/messages?with=${w.user.id}`}
                    className="text-xs text-brand-600 font-medium hover:underline shrink-0"
                  >
                    Message {w.user.name?.split(' ')[0]} &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}