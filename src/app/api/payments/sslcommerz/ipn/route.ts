import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    let tranId = '';
    let valId = '';
    let status = '';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      tranId = (formData.get('tran_id') as string) || '';
      valId = (formData.get('val_id') as string) || '';
      status = (formData.get('status') as string) || '';
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      tranId = body.tran_id || '';
      valId = body.val_id || '';
      status = body.status || '';
    }

    if (!tranId) {
      return NextResponse.json({ error: 'Missing tran_id' }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({ where: { trxId: tranId } });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.status === 'approved') {
      return NextResponse.json({ success: true, message: 'Already approved' });
    }

    if (status === 'VALID' || status === 'VALIDATED') {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'approved' },
      });

      if (payment.type === 'pro_subscription') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);
        await prisma.user.update({
          where: { id: payment.userId },
          data: {
            subscriptionPlan: 'pro',
            isVerifiedSeller: true,
            subscriptionExpires: expires,
          },
        });
      } else if (payment.type === 'item_pin' && payment.listingId) {
        const featuredUntil = new Date();
        featuredUntil.setDate(featuredUntil.getDate() + 7);
        await prisma.listing.update({
          where: { id: payment.listingId },
          data: {
            isFeatured: true,
            featuredUntil,
          },
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('SSLCommerz IPN POST error:', err);
    return NextResponse.json({ error: 'IPN processing error' }, { status: 500 });
  }
}

