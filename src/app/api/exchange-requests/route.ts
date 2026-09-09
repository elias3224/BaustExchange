// src/app/api/exchange-requests/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { createNotification } from '@/lib/notifications';
import { logActivity, ActivityType } from '@/lib/activity';
import { sendEmail } from '@/lib/mailer';
import { NotificationType } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const [incoming, outgoing] = await Promise.all([
      prisma.exchangeRequest.findMany({
        where: { receiverId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { listing: { include: { images: { take: 1 } } }, sender: true, receiver: true },
      }),
      prisma.exchangeRequest.findMany({
        where: { senderId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { listing: { include: { images: { take: 1 } } }, sender: true, receiver: true },
      }),
    ]);
    return NextResponse.json({ incoming, outgoing });
  } catch (err) {
    console.error('GET /api/exchange-requests error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`request:create:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { listingId, message, offeredItem } = body;
    if (!listingId || !message) {
      return NextResponse.json({ error: 'Listing and message are required.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id: listingId }, include: { user: true } });
    if (!listing) return NextResponse.json({ error: 'Item not found.' }, { status: 404 });
    if (listing.userId === user.id) return NextResponse.json({ error: 'You cannot request your own item.' }, { status: 400 });

    const existing = await prisma.exchangeRequest.findFirst({
      where: { listingId, senderId: user.id, receiverId: listing.userId, status: 'pending' },
    });
    if (existing) return NextResponse.json({ error: 'You already have a pending request for this item.' }, { status: 400 });

    const request = await prisma.exchangeRequest.create({
      data: {
        listingId, senderId: user.id, receiverId: listing.userId,
        message, offeredItem: offeredItem || null, status: 'pending',
      },
    });

    await createNotification(
      listing.userId,
      NotificationType.REQUEST_NEW,
      `${user.name || 'Someone'} wants to exchange your "${listing.title}".`,
      request.id
    );
    await logActivity(ActivityType.REQUEST_CREATED, `Sent exchange request for "${listing.title}"`, user.id, ip);

    if (process.env.SMTP_HOST) {
      const receiver = await prisma.user.findUnique({ where: { id: listing.userId } });
      if (receiver?.email) {
        await sendEmail(
          receiver.email,
          'New exchange request on BAUST Exchange',
          `<p>${user.name || 'Someone'} has sent you an exchange request for your item "${listing.title}".</p><p>Message: ${message}</p>`
        );
      }
    }

    return NextResponse.json({ id: request.id, status: request.status }, { status: 201 });
  } catch (err) {
    console.error('POST /api/exchange-requests error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
