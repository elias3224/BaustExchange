// src/app/api/messages/typing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

// In-memory store for typing states: "senderId:receiverId" => timestamp
const typingStore = new Map<string, number>();

// Clean up expired typing entries (> 5 seconds old) every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, timestamp] of typingStore.entries()) {
    if (now - timestamp > 5000) {
      typingStore.delete(key);
    }
  }
}, 30000);

export async function GET(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const partnerId = searchParams.get('with');
  if (!partnerId) return NextResponse.json({ isTyping: false });

  const key = `${partnerId}:${user.id}`;
  const lastTypingTime = typingStore.get(key);
  const isTyping = Boolean(lastTypingTime && Date.now() - lastTypingTime < 3500);

  return NextResponse.json({ isTyping });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  try {
    const body = await req.json();
    const { receiverId, isTyping } = body;
    if (!receiverId) return NextResponse.json({ error: 'Receiver required' }, { status: 400 });

    const key = `${user.id}:${receiverId}`;
    if (isTyping) {
      typingStore.set(key, Date.now());
    } else {
      typingStore.delete(key);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to update typing status' }, { status: 500 });
  }
}
