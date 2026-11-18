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
  const withUser = searchParams.get('with');

  try {
    if (withUser) {
      // Find request in either direction
      const request = await prisma.messageRequest.findFirst({
        where: {
          OR: [
            { senderId: user.id, receiverId: withUser },
            { senderId: withUser, receiverId: user.id },
          ],
        },
      });

      return NextResponse.json({ request });
    }

    // List incoming pending requests for the current user
    const pendingIncoming = await prisma.messageRequest.findMany({
      where: {
        receiverId: user.id,
        status: 'pending',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            image: true,
            department: true,
            role: true,
            isVerifiedSeller: true,
            subscriptionPlan: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ pendingRequests: pendingIncoming });
  } catch (err) {
    console.error('GET /api/messages/requests error:', err);
    return NextResponse.json({ error: 'Failed to fetch message requests' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { receiverId } = body;

    if (!receiverId || receiverId === user.id) {
      return NextResponse.json({ error: 'Valid recipient is required' }, { status: 400 });
    }

    // Check if a request already exists between them
    let request = await prisma.messageRequest.findFirst({
      where: {
        OR: [
          { senderId: user.id, receiverId },
          { senderId: receiverId, receiverId: user.id },
        ],
      },
    });

    if (!request) {
      request = await prisma.messageRequest.create({
        data: {
          senderId: user.id,
          receiverId,
          status: 'pending',
        },
      });
    }

    return NextResponse.json({ success: true, request });
  } catch (err) {
    console.error('POST /api/messages/requests error:', err);
    return NextResponse.json({ error: 'Failed to create message request' }, { status: 500 });
  }
}
