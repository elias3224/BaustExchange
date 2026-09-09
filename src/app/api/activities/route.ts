// src/app/api/activities/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const { searchParams } = req.nextUrl;
    const limit = Number(searchParams.get('limit') || 20);

    const activities = await prisma.activity.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return NextResponse.json({ activities });
  } catch (err) {
    console.error('GET /api/activities error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
