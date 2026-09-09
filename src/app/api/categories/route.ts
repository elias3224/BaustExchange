// src/app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export async function GET(req: NextRequest) {
  const categories = await prisma.category.findMany({
    where: { enabled: true },
    orderBy: { name: 'asc' },
  });
  return NextResponse.json(
    { categories },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
