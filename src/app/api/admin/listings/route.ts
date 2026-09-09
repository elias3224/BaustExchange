// src/app/api/admin/listings/route.ts
// Admin: list listings by status (defaults to pending queue).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'active', 'sold', 'exchanged', 'given', 'rejected', 'removed'];

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const statusParam = req.nextUrl.searchParams.get('status');
    const where: any = {};
    if (statusParam && STATUSES.includes(statusParam)) where.status = statusParam;

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        user: { select: { id: true, name: true, email: true, department: true } },
      },
    });
    return NextResponse.json({ listings });
  } catch (err) {
    console.error('GET /api/admin/listings error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}