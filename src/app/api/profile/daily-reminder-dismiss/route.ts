// src/app/api/profile/daily-reminder-dismiss/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function POST() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastDailyLoginReminderAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('daily-reminder-dismiss error:', err);
    return NextResponse.json({ error: 'Failed to record reminder dismissal' }, { status: 500 });
  }
}
