import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
  }

  const ip = clientIp(req);
  if (!rateLimit(`payment:sslcommerz:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { type, listingId, customerPhone } = body;

    if (!type || (type !== 'pro_subscription' && type !== 'item_pin')) {
      return NextResponse.json({ error: 'Invalid plan type selected.' }, { status: 400 });
    }

    if (type === 'item_pin' && !listingId) {
      return NextResponse.json({ error: 'Listing ID is required for pinning an item.' }, { status: 400 });
    }

    // Verify listing exists if type is item_pin
    if (type === 'item_pin' && listingId) {
      const listing = await prisma.listing.findUnique({ where: { id: listingId } });
      if (!listing) {
        return NextResponse.json({ error: 'Specified listing was not found.' }, { status: 404 });
      }
    }

    const amount = type === 'pro_subscription' ? 49 : 20;
    const storeId = process.env.SSLCOMMERZ_STORE_ID || 'baust6a9ed2a72ad80';
    const storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD || 'baust6a9ed2a72ad80@ssl';
    const isLive = process.env.SSLCOMMERZ_IS_LIVE === 'true';
    const phone = (customerPhone && customerPhone.trim().length > 0) ? customerPhone.trim() : (user.phone || '01700000000');

    // Base URL resolution
    const hostHeader = req.headers.get('host');
    const protocol = hostHeader && (hostHeader.startsWith('localhost') || hostHeader.startsWith('127.')) ? 'http' : 'https';
    const appUrl =
      process.env.AUTH_URL ||
      process.env.NEXTAUTH_URL ||
      (hostHeader ? `${protocol}://${hostHeader}` : 'http://localhost:3000');

    // Unique transaction ID
    const tranId = `SSL${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // 1. Record pending payment in DB
    await prisma.payment.create({
      data: {
        userId: user.id,
        type,
        listingId: listingId || null,
        amount,
        paymentMethod: 'SSLCommerz',
        trxId: tranId,
        senderPhone: phone,
        status: 'pending',
      },
    });

    // 2. Prepare payload for SSLCommerz
    const sslParams = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: amount.toString(),
      currency: 'BDT',
      tran_id: tranId,
      success_url: `${appUrl}/api/payments/sslcommerz/callback?status=success`,
      fail_url: `${appUrl}/api/payments/sslcommerz/callback?status=fail`,
      cancel_url: `${appUrl}/api/payments/sslcommerz/callback?status=cancel`,
      ipn_url: `${appUrl}/api/payments/sslcommerz/ipn`,
      cus_name: user.name || 'BAUST Student',
      cus_email: user.email || 'student@baust.edu.bd',
      cus_add1: 'BAUST Campus',
      cus_city: 'Saidpur',
      cus_postcode: '5310',
      cus_country: 'Bangladesh',
      cus_phone: phone,
      shipping_method: 'NO',
      product_name: type === 'pro_subscription' ? 'BAUST Campus PRO Subscription' : 'BAUST Listing Pin',
      product_category: 'Digital Service',
      product_profile: 'general',
    });

    const apiUrl = isLive
      ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    const sslRes = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: sslParams.toString(),
    });

    const sslData = await sslRes.json();

    if (sslData?.status === 'SUCCESS' && sslData?.GatewayPageURL) {
      return NextResponse.json({ success: true, url: sslData.GatewayPageURL, tranId });
    }

    console.error('SSLCommerz Session Init Error:', sslData);
    return NextResponse.json(
      { error: sslData?.failedreason || 'Failed to initialize SSLCommerz gateway session.' },
      { status: 500 }
    );
  } catch (err: any) {
    console.error('POST /api/payments/sslcommerz/init error:', err);
    return NextResponse.json({ error: 'Server error initiating SSLCommerz payment.' }, { status: 500 });
  }
}
