// src/app/api/messages/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { partnerId } = body;

    const whereClause: any = {
      receiverId: user.id,
      isRead: false,
    };

    if (partnerId && typeof partnerId === 'string') {
      whereClause.senderId = partnerId;
    }

    // Mark messages received by current user as read
    await prisma.message.updateMany({
      where: whereClause,
      data: { isRead: true },
    });

    // Also mark related MESSAGE notifications as read for current user
    await prisma.notification.updateMany({
      where: {
        userId: user.id,
        type: NotificationType.MESSAGE,
        isRead: false,
      },
      data: { isRead: true },
    });

    // Fetch the updated total unread count for current user
    const unreadCount = await prisma.message.count({
      where: {
        receiverId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ success: true, unreadCount });
  } catch (err) {
    console.error('POST /api/messages/read error:', err);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}
