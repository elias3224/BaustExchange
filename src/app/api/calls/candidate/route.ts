import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { callId, candidate } = body;

    if (!callId || !candidate) {
      return NextResponse.json({ error: 'Missing candidate parameters' }, { status: 400 });
    }

    const session = await prisma.callSession.findUnique({ where: { id: callId } });
    if (!session) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
    }

    if (session.callerId !== user.id && session.receiverId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const currentCandidates = Array.isArray(session.candidates) ? session.candidates : [];
    const updatedCandidates = [...currentCandidates, candidate];

    await prisma.callSession.update({
      where: { id: callId },
      data: {
        candidates: updatedCandidates,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('POST /api/calls/candidate error:', err);
    return NextResponse.json({ error: 'Failed to add ICE candidate' }, { status: 500 });
  }
}
