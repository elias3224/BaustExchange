// src/app/api/messages/unread-count/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ unreadCount: 0 });
  }

  try {
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (err) {
    console.error('GET /api/messages/unread-count error:', err);
    return NextResponse.json({ unreadCount: 0 });
  }
}
