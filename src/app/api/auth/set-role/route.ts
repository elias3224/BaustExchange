import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { ADMIN_EMAILS } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const user = await currentUser(req);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const roleInput = body?.role;

    if (roleInput !== 'student' && roleInput !== 'teacher') {
      return NextResponse.json({ error: 'Invalid role selection. Must be Student or Teacher.' }, { status: 400 });
    }

    const isTargetAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    const finalRole = isTargetAdmin ? 'admin' : roleInput;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        role: finalRole as any,
        hasSelectedRole: true,
      },
      select: {
        id: true,
        email: true,
        role: true,
        hasSelectedRole: true,
        isVerifiedSeller: true,
      },
    });

    return NextResponse.json({
      success: true,
      role: updated.role,
      hasSelectedRole: updated.hasSelectedRole,
      isVerifiedSeller: updated.isVerifiedSeller,
    });
  } catch (err) {
    console.error('POST /api/auth/set-role error:', err);
    return NextResponse.json({ error: 'Failed to update user role.' }, { status: 500 });
  }
}

