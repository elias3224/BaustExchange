// src/app/api/wanted/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const active = searchParams.get('active') === 'true';
    const limit = Number(searchParams.get('limit') || 20);

    const where: any = {};
    if (active) where.status = 'active';

    const items = await prisma.wantedItem.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { category: true, user: { select: { id: true, name: true, role: true, department: true } } },
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error('GET /api/wanted error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`wanted:create:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { title, categoryId, description, budget } = body;
    if (!title || !categoryId) return NextResponse.json({ error: 'Title and category are required.' }, { status: 400 });

    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!cat) return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });

    const item = await prisma.wantedItem.create({
      data: {
        userId: user.id,
        title,
        categoryId,
        description: description || null,
        budget: budget ? Number(budget) : null,
        status: 'active',
      },
    });
    return NextResponse.json({ id: item.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/wanted error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
