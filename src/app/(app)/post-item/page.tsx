// src/app/(app)/post-item/page.tsx
import prisma from '@/lib/prisma';
import PostItemForm from '@/components/forms/PostItemForm';

export const dynamic = 'force-dynamic';

export default async function PostItemPage() {
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return <PostItemForm categories={categories} />;
}