// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const limit = Number(searchParams.get('limit') || 20);
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: any = { userId: user.id };
    if (unreadOnly) where.isRead = false;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({ where: { userId: user.id, isRead: false } }),
    ]);
    return NextResponse.json({ notifications, unreadCount });
  } catch (err) {
    console.error('GET /api/notifications error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const id = searchParams.get('id');
    if (id) {
      await prisma.notification.update({ where: { id, userId: user.id }, data: { isRead: true } });
    } else {
      // No id: mark every unread notification as read.
      await prisma.notification.updateMany({ where: { userId: user.id, isRead: false }, data: { isRead: true } });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/notifications error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
