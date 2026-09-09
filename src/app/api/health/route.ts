// src/app/api/health/route.ts
// Lightweight health-check endpoint (public per middleware).
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  let db = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    db = 'unreachable';
  }
  return NextResponse.json({
    status: 'ok',
    db,
    timestamp: new Date().toISOString(),
  });
}