// src/app/api/admin/reports/route.ts
// Admin: list reports (optionally filtered by status).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';

export const dynamic = 'force-dynamic';

const STATUSES = ['pending', 'reviewed', 'resolved', 'dismissed'];

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

    const reports = await prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, status: true } },
      },
    });
    return NextResponse.json({ reports });
  } catch (err) {
    console.error('GET /api/admin/reports error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}