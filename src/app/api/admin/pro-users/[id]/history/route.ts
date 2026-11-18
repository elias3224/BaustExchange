import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await currentUser(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const histories = await prisma.subscriptionHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ user, histories });
  } catch (err: any) {
    console.error('GET /api/admin/pro-users/[id]/history error:', err);
    return NextResponse.json({ error: 'Failed to fetch subscription history' }, { status: 500 });
  }
}
