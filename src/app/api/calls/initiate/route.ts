import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { checkProEntitlement } from '@/lib/pro';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Check PRO entitlement for calls
  const entitlement = await checkProEntitlement(user.id, 'audio_video_call');
  if (!entitlement.allowed) {
    return NextResponse.json(
      {
        error: 'Audio and Video calls are exclusive to Campus PRO members. Upgrade to PRO to call sellers directly!',
        isProRequired: true,
      },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { receiverId, type, offer } = body;

    if (!receiverId || !type || !offer) {
      return NextResponse.json({ error: 'Missing required call parameters' }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Clean up any stale ringing calls between these two users
    await prisma.callSession.updateMany({
      where: {
        callerId: user.id,
        receiverId,
        status: 'ringing',
      },
      data: { status: 'missed' },
    });

    const callSession = await prisma.callSession.create({
      data: {
        callerId: user.id,
        receiverId,
        type: type === 'video' ? 'video' : 'audio',
        status: 'ringing',
        offer: typeof offer === 'string' ? offer : JSON.stringify(offer),
        candidates: [],
      },
    });

    return NextResponse.json({ success: true, callSession });
  } catch (err) {
    console.error('POST /api/calls/initiate error:', err);
    return NextResponse.json({ error: 'Failed to initiate call session' }, { status: 500 });
  }
}
