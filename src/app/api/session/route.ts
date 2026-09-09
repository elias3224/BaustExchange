// src/app/api/session/route.ts
// A small helper endpoint that returns the current session (or 401).
// Useful for client components that need user info without React Context.
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session.user });
}
