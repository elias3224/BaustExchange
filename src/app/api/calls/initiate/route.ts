import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { isActualProSubscription } from '@/lib/pro';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId, type, offer } = body;

    if (!receiverId || !type || !offer) {
      return NextResponse.json({ error: 'Missing required call parameters' }, { status: 400 });
    }

    // Validate both caller and receiver active PRO status
    const [caller, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionExpires: true,
        },
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        select: {
          id: true,
          name: true,
          subscriptionPlan: true,
          subscriptionExpires: true,
        },
      }),
    ]);

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isCallerPro = isActualProSubscription(caller);
    const isReceiverPro = isActualProSubscription(receiver);

    // Strictly enforce: PRO-to-PRO only
    // Blocks: PRO -> Non-PRO, Non-PRO -> PRO, Non-PRO -> Non-PRO
    if (!isCallerPro || !isReceiverPro) {
      return NextResponse.json(
        {
          error: 'Calling is available exclusively between active PRO members.',
          isProRequired: !isCallerPro,
          isReceiverNotPro: !isReceiverPro,
        },
        { status: 403 }
      );
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
