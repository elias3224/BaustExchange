import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q');
    const actionType = searchParams.get('actionType');
    const page = Math.max(1, Number(searchParams.get('page')) || 1);
    const take = 25;
    const skip = (page - 1) * take;

    const where: any = {};

    if (actionType && actionType !== 'all') {
      where.actionType = actionType;
    }

    if (q) {
      where.OR = [
        { adminName: { contains: q, mode: 'insensitive' } },
        { adminEmail: { contains: q, mode: 'insensitive' } },
        { targetEmail: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { actionType: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.adminAuditLog.count({ where }),
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      pages: Math.ceil(total / take),
    });
  } catch (err) {
    console.error('GET /api/admin/audit-logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
