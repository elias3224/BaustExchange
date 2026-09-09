// src/app/(app)/notifications/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { NotificationsClient } from '@/components/notifications/NotificationsClient';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const user = await currentUser();
  if (!user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return <NotificationsClient notifications={notifications as any} />;
}