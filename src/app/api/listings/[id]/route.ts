// src/app/api/listings/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`listing:delete:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const { id } = await params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (listing.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to delete this item.' }, { status: 403 });
    }

    await prisma.listingImage.deleteMany({ where: { listingId: listing.id } });
    await prisma.exchangeRequest.deleteMany({ where: { listingId: listing.id } });
    await prisma.message.deleteMany({ where: { listingId: listing.id } });
    await prisma.report.deleteMany({ where: { listingId: listing.id } });
    await prisma.listing.delete({ where: { id: listing.id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/listings/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`listing:patch:${ip}`, { max: 20, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { status, ...rest } = body;

    const { id } = await params;
    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    if (listing.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json({ error: 'You do not have permission to edit this item.' }, { status: 403 });
    }

    const allowed = [
      'title',
      'description',
      'categoryId',
      'condition',
      'transactionType',
      'price',
      'quantity',
      'exchangeFor',
      'location',
      'contactPreference',
      'status',
    ];
    const data: any = {};
    for (const k of allowed) {
      if (rest[k] !== undefined) data[k] = rest[k];
    }
    if (status) data.status = status;

    const updated = await prisma.listing.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/listings/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
