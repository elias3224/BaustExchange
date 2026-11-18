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
    const { callId, status, answer } = body;

    if (!callId || !status || (status !== 'accepted' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Invalid response parameters' }, { status: 400 });
    }

    const session = await prisma.callSession.findUnique({ where: { id: callId } });
    if (!session) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 });
    }

    if (session.receiverId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to respond to this call' }, { status: 403 });
    }

    const updated = await prisma.callSession.update({
      where: { id: callId },
      data: {
        status,
        answer: answer ? (typeof answer === 'string' ? answer : JSON.stringify(answer)) : null,
      },
    });

    return NextResponse.json({ success: true, callSession: updated });
  } catch (err) {
    console.error('POST /api/calls/respond error:', err);
    return NextResponse.json({ error: 'Failed to respond to call' }, { status: 500 });
  }
}
