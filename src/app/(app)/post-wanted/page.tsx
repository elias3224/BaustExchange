// src/app/(app)/post-wanted/page.tsx
import prisma from '@/lib/prisma';
import { WantedForm } from '@/components/wanted/WantedForm';

export const dynamic = 'force-dynamic';

export default async function PostWantedPage() {
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return <WantedForm categories={categories} />;
}