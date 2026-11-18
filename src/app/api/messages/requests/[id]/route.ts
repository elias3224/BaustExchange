import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = body; // 'accepted' or 'rejected'

    if (!status || (status !== 'accepted' && status !== 'rejected')) {
      return NextResponse.json({ error: 'Status must be accepted or rejected' }, { status: 400 });
    }

    const request = await prisma.messageRequest.findUnique({ where: { id } });
    if (!request) {
      return NextResponse.json({ error: 'Message request not found' }, { status: 404 });
    }

    // Only the receiver can accept or reject
    if (request.receiverId !== user.id) {
      return NextResponse.json({ error: 'Only recipient can accept or reject this request' }, { status: 403 });
    }

    const updated = await prisma.messageRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, request: updated });
  } catch (err) {
    console.error('PATCH /api/messages/requests/[id] error:', err);
    return NextResponse.json({ error: 'Failed to update message request' }, { status: 500 });
  }
}
