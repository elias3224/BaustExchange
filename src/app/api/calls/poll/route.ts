import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const callId = searchParams.get('callId');
  const checkIncoming = searchParams.get('incoming') === 'true';

  try {
    if (callId) {
      const callSession = await prisma.callSession.findUnique({
        where: { id: callId },
        include: {
          caller: { select: { id: true, name: true, image: true, department: true } },
          receiver: { select: { id: true, name: true, image: true, department: true } },
        },
      });

      return NextResponse.json({ callSession });
    }

    if (checkIncoming) {
      // Find any ringing call targeted at current user within the last 45 seconds
      const fortyFiveSecsAgo = new Date(Date.now() - 45 * 1000);
      const incomingCall = await prisma.callSession.findFirst({
        where: {
          receiverId: user.id,
          status: 'ringing',
          createdAt: { gte: fortyFiveSecsAgo },
        },
        include: {
          caller: { select: { id: true, name: true, image: true, department: true } },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ incomingCall: incomingCall || null });
    }

    return NextResponse.json({ error: 'Provide callId or incoming=true' }, { status: 400 });
  } catch (err) {
    console.error('GET /api/calls/poll error:', err);
    return NextResponse.json({ error: 'Failed to poll call status' }, { status: 500 });
  }
}
