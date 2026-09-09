// src/app/api/profile/route.ts
// GET  -> current user's full profile (from the database)
// PATCH -> update department / studentId / phone / image / role
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { updateProfileSchema } from '@/lib/validations';
import { rateLimit, clientIp } from '@/lib/ratelimit';
import { logActivity, ActivityType } from '@/lib/activity';
import { ADMIN_EMAILS } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      status: true,
      isVerifiedSeller: true,
      hasSelectedRole: true,
      department: true,
      studentId: true,
      phone: true,
      createdAt: true,
    },
  });
  if (!profile) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json({ user: profile });
}

export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const ip = clientIp(req);
  if (!rateLimit(`profile:update:${ip}`, { max: 10, window: 60 })) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const parsed = updateProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const data = parsed.data;
    const isTargetAdmin = user.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
    
    // Prevent normal users from changing role to admin
    let roleToSave: string | undefined = undefined;
    if (isTargetAdmin || user.role === 'admin') {
      roleToSave = 'admin';
    } else if (data.role === 'student' || data.role === 'teacher') {
      roleToSave = data.role;
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        department: data.department || null,
        studentId: data.studentId || null,
        phone: data.phone || null,
        ...(data.image ? { image: data.image } : {}),
        ...(roleToSave ? { role: roleToSave as any, hasSelectedRole: true } : {}),
        ...(data.isVerifiedSeller !== undefined ? { isVerifiedSeller: data.isVerifiedSeller } : {}),
      },
      select: { id: true, department: true, studentId: true, phone: true, image: true, role: true, isVerifiedSeller: true, hasSelectedRole: true },
    });

    await logActivity(ActivityType.LISTING_UPDATED, 'Updated profile', user.id, ip);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/profile error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}