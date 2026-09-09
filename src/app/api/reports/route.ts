// src/app/api/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { logActivity, ActivityType } from '@/lib/activity';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`report:create:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { listingId, reportedUserId, reason, description } = body;
    if (!reason) return NextResponse.json({ error: 'Reason is required.' }, { status: 400 });

    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        listingId: listingId || null,
        reportedUserId: reportedUserId || null,
        reason,
        description: description || null,
        status: 'pending',
      },
    });

    await logActivity(ActivityType.REPORT_CREATED, `Reported item/user for "${reason}"`, user.id, ip);
    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (err) {
    console.error('POST /api/reports error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
