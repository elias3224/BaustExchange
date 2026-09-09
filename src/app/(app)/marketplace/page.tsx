import Link from 'next/link';
import { ListingCard } from '@/components/marketplace/ListingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { FiltersForm } from '@/components/marketplace/Filters';
import { Pagination } from '@/components/marketplace/Pagination';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MarketplacePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = (sp.q as string) || '';
  const category = (sp.category as string) || '';
  const condition = (sp.condition as string) || '';
  const transactionType = (sp.transactionType as string) || '';
  const minPrice = (sp.minPrice as string) || '';
  const maxPrice = (sp.maxPrice as string) || '';
  const department = (sp.department as string) || '';
  const page = Number((sp.page as string) || 1);

  const limit = 12;

  const where: any = { status: 'active' };

  // Search by title or description
  if (q) {
    where.OR = [{ title: { contains: q } }, { description: { contains: q } }];
  }

  // Filter by category (slug or exact name)
  if (category) {
    const cat = await prisma.category.findFirst({
      where: { OR: [{ slug: category.toLowerCase() }, { name: category }] },
      select: { id: true, slug: true },
    });
    if (cat) where.categoryId = cat.id;
  }

  // Filter by condition
  if (condition) where.condition = condition;

  // Filter by transaction type
  if (transactionType) where.transactionType = transactionType;

  // Filter by user's department
  if (department) {
    where.user = { department: { contains: department } };
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    where.AND = where.AND || [];
    if (minPrice) where.AND.push({ price: { gte: Number(minPrice) } });
    if (maxPrice) where.AND.push({ price: { lte: Number(maxPrice) } });
  }

  const [categories, total, listings] = await Promise.all([
    prisma.category.findMany({ where: { enabled: true }, orderBy: { name: 'asc' } }),
    prisma.listing.count({ where }),
    prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        user: { select: { id: true, name: true, image: true, role: true, department: true } },
      },
    }),
  ]);

  const pages = Math.ceil(total / limit);
  const params = { q, category, condition, transactionType, minPrice, maxPrice, department, page };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Marketplace</h1>
      <FiltersForm categories={categories} params={params} />
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{total} item(s) found</p>
      </div>
      {listings.length === 0 ? (
        <EmptyState title="No listings found." description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l as any} />
            ))}
          </div>
          <Pagination
            current={page}
            pages={pages}
            params={{ q, category, condition, transactionType, minPrice, maxPrice, department }}
          />
        </>
      )}
    </div>
  );
}
