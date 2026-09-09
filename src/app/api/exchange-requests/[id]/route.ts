// src/app/api/exchange-requests/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { createNotification } from '@/lib/notifications';
import { logActivity, ActivityType } from '@/lib/activity';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { sendEmail } from '@/lib/mailer';
import { TransactionType, RequestStatus, NotificationType } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`request:update:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { action } = body; // 'accept' | 'reject' | 'cancel' | 'complete'

    const { id } = await params;
    const request = await prisma.exchangeRequest.findUnique({
      where: { id },
      include: { listing: true, sender: true, receiver: true },
    });
    if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 });

    if (['accept', 'reject'].includes(action) && request.receiverId !== user.id) {
      return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
    }
    if (action === 'cancel' && request.senderId !== user.id) {
      return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
    }
    if (action === 'complete' && request.senderId !== user.id && request.receiverId !== user.id) {
      return NextResponse.json({ error: 'You do not have permission.' }, { status: 403 });
    }

    const NOTIF_TYPE: Record<string, NotificationType> = {
      accept: NotificationType.REQUEST_ACCEPTED,
      reject: NotificationType.REQUEST_REJECTED,
      cancel: NotificationType.REQUEST_REJECTED,
      complete: NotificationType.REQUEST_ACCEPTED,
    };

    const ACT: Record<string, string> = {
      accept: ActivityType.REQUEST_ACCEPTED,
      reject: ActivityType.REQUEST_REJECTED,
      cancel: ActivityType.REQUEST_CANCELLED,
      complete: ActivityType.REQUEST_COMPLETED,
    };

    let status: RequestStatus = request.status;
    const verbMap: Record<string, string> = { accept: 'accepted', reject: 'rejected', cancel: 'cancelled', complete: 'completed' };
    if (action === 'accept') status = 'accepted';
    if (action === 'reject') status = 'rejected';
    if (action === 'cancel') status = 'cancelled';
    if (action === 'complete') status = 'completed';

    const updated = await prisma.exchangeRequest.update({
      where: { id },
      data: { status },
    });

    const otherId = action === 'cancel' ? request.receiverId :
      (['accept', 'reject'].includes(action) ? request.senderId : null);
    if (otherId) {
      const verb = verbMap[action] || 'updated';
      await createNotification(
        otherId,
        NOTIF_TYPE[action] || NotificationType.REQUEST_NEW,
        `${user.name || 'User'} ${verb} your exchange request for "${request.listing?.title ?? ''}".`,
        request.id
      );
    }

    if (action === 'accept' && request.listing?.transactionType === TransactionType.exchange) {
      await prisma.listing.update({ where: { id: request.listing.id }, data: { status: 'exchanged' } });
    }
    if (action === 'complete') {
      await prisma.listing.updateMany({ where: { id: request.listingId }, data: { status: 'exchanged' } });
    }

    await logActivity(ACT[action] || ActivityType.REQUEST_CREATED,
      `${verbMap[action] || 'updated'} request for "${request.listing?.title ?? ''}"`, user.id, ip);

    if (process.env.SMTP_HOST && (action === 'accept' || action === 'reject')) {
      if (request.sender.email) {
        sendEmail(
          request.sender.email,
          `Your exchange request was ${verbMap[action] || 'updated'}`,
          `<p>Your request for "${request.listing?.title ?? ''}" was ${verbMap[action] || 'updated'} by ${user.name || 'the owner'}.</p>`
        ).catch(() => {});
      }
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/exchange-requests/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}


