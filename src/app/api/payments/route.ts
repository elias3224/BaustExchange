import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ip = clientIp(req);
  if (!rateLimit(`payment:create:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { type, listingId, amount, paymentMethod, trxId, senderPhone } = body;

    if (!type || !amount || !paymentMethod || !trxId || !senderPhone) {
      return NextResponse.json({ error: 'All payment fields are required.' }, { status: 400 });
    }

    // Check if TrxID already submitted
    const existing = await prisma.payment.findFirst({
      where: { trxId: trxId.trim() },
    });
    if (existing) {
      return NextResponse.json({ error: 'This Transaction ID (TrxID) has already been submitted.' }, { status: 400 });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: user.id,
        type,
        listingId: listingId || null,
        amount: Number(amount),
        paymentMethod,
        trxId: trxId.trim(),
        senderPhone: senderPhone.trim(),
        status: 'pending',
      },
    });

    // Create system notification for user
    await prisma.notification.create({
      data: {
        userId: user.id,
        type: 'ADMIN',
        message: `Your ${paymentMethod} payment (TrxID: ${trxId}) of ৳${amount} has been submitted for review. It will be activated shortly!`,
      },
    });

    return NextResponse.json({ success: true, payment });
  } catch (err: any) {
    console.error('POST /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to process payment submission.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    if (user.role === 'admin') {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      });
      return NextResponse.json({ payments });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ payments });
  } catch (err) {
    console.error('GET /api/payments error:', err);
    return NextResponse.json({ error: 'Failed to fetch payments.' }, { status: 500 });
  }
}

