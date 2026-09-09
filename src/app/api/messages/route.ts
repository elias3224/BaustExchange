// src/app/api/messages/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';
import { sendEmail } from '@/lib/mailer';
import { NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const listingId = searchParams.get('listingId');
    const withUser = searchParams.get('with');

    const where: any = {
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    };
    if (listingId) where.listingId = listingId;
    if (withUser) {
      where.OR = [
        { senderId: user.id, receiverId: withUser },
        { senderId: withUser, receiverId: user.id },
      ];
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { sender: true, receiver: true, listing: true },
    });

    // Group by conversation partner.
    const conversations: Record<string, any[]> = {};
    for (const m of messages) {
      const partner = m.senderId === user.id ? m.receiverId : m.senderId;
      if (!conversations[partner]) conversations[partner] = [];
      conversations[partner].push(m);
    }

    return NextResponse.json({ messages, conversations });
  } catch (err) {
    console.error('GET /api/messages error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`message:create:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { receiverId, listingId, message } = body;
    if (!receiverId || !message) return NextResponse.json({ error: 'Receiver and message are required.' }, { status: 400 });

    // Don't allow messaging blocked users.
    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return NextResponse.json({ error: 'Recipient not found.' }, { status: 404 });
    if (receiver.status === 'blocked') return NextResponse.json({ error: 'Cannot message this user.' }, { status: 400 });

    const msg = await prisma.message.create({
      data: { senderId: user.id, receiverId, listingId: listingId || null, message, isRead: false },
    });

    await createNotification(receiverId, NotificationType.MESSAGE, `${user.name || 'Someone'} sent you a message.`, msg.id);

    if (process.env.SMTP_HOST && receiver.email) {
      await sendEmail(
        receiver.email,
        'New message on BAUST Exchange',
        `<p>${user.name || 'Someone'} sent you a message: ${message}</p>`
      );
    }

    return NextResponse.json({ id: msg.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/messages error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
