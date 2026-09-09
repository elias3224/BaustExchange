// src/app/(app)/messages/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { MessagesClient } from '@/components/messages/MessagesClient';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function MessagesPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await currentUser();
  if (!user) return null;

  const sp = await searchParams;
  const initialPartner = (sp.with as string) || '';

  const messages = await prisma.message.findMany({
    where: { OR: [{ senderId: user.id }, { receiverId: user.id }] },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: { select: { id: true, name: true, image: true } },
      receiver: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true } },
    },
  });

  return (
    <MessagesClient
      currentUserId={user.id}
      initialPartner={initialPartner}
      messages={messages as any}
    />
  );
}