import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

async function handleCallback(req: NextRequest) {
  const storeId = process.env.SSLCOMMERZ_STORE_ID || 'baust6a9ed2a72ad80';
  const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || 'baust6a9ed2a72ad80@ssl';
  const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';

  const hostHeader = req.headers.get('host');
  const protocol = hostHeader && (hostHeader.startsWith('localhost') || hostHeader.startsWith('127.')) ? 'http' : 'https';
  const appUrl =
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    (hostHeader ? `${protocol}://${hostHeader}` : 'http://localhost:3000');

  const { searchParams } = new URL(req.url);
  const callbackStatus = searchParams.get('status'); // 'success', 'fail', 'cancel'

  let tranId = '';
  let valId = '';
  let cardType = '';

  // Extract body parameters (SSLCommerz sends POST form data)
  try {
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      tranId = (formData.get('tran_id') as string) || '';
      valId = (formData.get('val_id') as string) || '';
      cardType = (formData.get('card_type') as string) || '';
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      tranId = body.tran_id || '';
      valId = body.val_id || '';
      cardType = body.card_type || '';
    }
  } catch (err) {
    console.warn('SSLCommerz callback body parsing warning:', err);
  }

  // Fallback to searchParams if not in body
  if (!tranId) tranId = searchParams.get('tran_id') || searchParams.get('trxId') || '';
  if (!valId) valId = searchParams.get('val_id') || '';

  if (!tranId) {
    return NextResponse.redirect(`${appUrl}/upgrade?status=error&msg=Missing+transaction+ID`, 303);
  }

  const payment = await prisma.payment.findFirst({
    where: { trxId: tranId },
  });

  if (!payment) {
    return NextResponse.redirect(`${appUrl}/upgrade?status=error&msg=Payment+record+not+found`, 303);
  }

  if (callbackStatus === 'success' || valId) {
    // Perform SSLCommerz server validation if val_id is present
    let isValid = true;
    if (valId) {
      try {
        const valUrl = isLive
          ? `https://securepay.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&v=1&format=json`
          : `https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${storeId}&store_passwd=${storePassword}&v=1&format=json`;

        const valRes = await fetch(valUrl);
        const valData = await valRes.json();
        if (valData?.status !== 'VALID' && valData?.status !== 'VALIDATED') {
          console.warn('SSLCommerz validation warning:', valData);
          if (isLive) isValid = false;
        }
      } catch (e) {
        console.error('SSLCommerz validation request failed:', e);
      }
    }

    if (isValid) {
      // 1. Update Payment status
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'approved',
          paymentMethod: cardType ? `SSLCommerz (${cardType})` : 'SSLCommerz',
        },
      });

      // 2. Activate subscription or pin
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

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'ADMIN',
            message: '🎉 Instant SSLCommerz Payment Successful! Your Campus PRO Membership is now active.',
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

        await prisma.notification.create({
          data: {
            userId: payment.userId,
            type: 'ADMIN',
            message: '📌 Instant SSLCommerz Payment Successful! Your listing has been pinned for 7 days.',
          },
        });
      }

      return NextResponse.redirect(`${appUrl}/upgrade?status=success&trxId=${tranId}`, 303);
    }
  }

  // Payment failed or cancelled
  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: 'rejected' },
  });

  const finalStatus = callbackStatus === 'cancel' ? 'cancel' : 'failed';
  return NextResponse.redirect(`${appUrl}/upgrade?status=${finalStatus}&trxId=${tranId}`, 303);
}

export async function POST(req: NextRequest) {
  return handleCallback(req);
}

export async function GET(req: NextRequest) {
  return handleCallback(req);
}
