// src/app/api/admin/users/route.ts
// Admin: list users (with listing counts).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const q = req.nextUrl.searchParams.get('q');
    const where: any = {};
    if (q) where.OR = [{ name: { contains: q } }, { email: { contains: q } }];

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        department: true,
        studentId: true,
        idCardStatus: true,
        idCardUrl: true,
        idCardRejectReason: true,
        updatedAt: true,
        createdAt: true,
        _count: { select: { listings: true, reports: true } },
      },
    });
    return NextResponse.json({ users });
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}