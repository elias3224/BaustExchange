import { notFound, redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import EditItemForm from '@/components/forms/EditItemForm';

export const dynamic = 'force-dynamic';

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect('/login');

  const listing = await prisma.listing.findUnique({
    where: { id },
  });

  if (!listing) notFound();
  if (listing.userId !== user.id && user.role !== 'admin') {
    redirect('/marketplace');
  }

  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });

  return <EditItemForm listing={listing} categories={categories} />;
}

