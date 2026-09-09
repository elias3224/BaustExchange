import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required.' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body; // 'approved' or 'rejected'

    if (!status || (status !== 'approved' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id },
      data: { status },
    });

    if (status === 'approved') {
      if (payment.type === 'pro_subscription') {
        // Upgrade user to PRO & Verified Seller
        const expires = new Date();
        expires.setDate(expires.getDate() + 30); // 30 days
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionPlan: 'pro',
            isVerifiedSeller: true,
            subscriptionExpires: expires,
          },
        });

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'ADMIN',
            message: '🎉 Congratulations! Your Campus PRO Membership is now active. You have a Verified Seller badge and priority listing privileges!',
          },
        });
      } else if (payment.type === 'item_pin' && payment.listingId) {
        // Feature/Pin item for 7 days
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + 7);
        await prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            isFeatured: true,
            featuredUntil,
          },
        });

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'ADMIN',
            message: '📌 Your listing has been pinned & featured at the top of the Marketplace for 7 days!',
          },
        });
      }
    } else if (status === 'rejected') {
      await prisma.notification.create({
        data: {
          userId: payment.userId,
          type: 'ADMIN',
          message: `Your payment (TrxID: ${payment.trxId}) could not be verified. Please check the TrxID or contact support.`,
        },
      });
    }

    return NextResponse.json({ success: true, payment: updatedPayment });
  } catch (err) {
    console.error('PATCH /api/admin/payments/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update payment.' }, { status: 500 });
  }
}

