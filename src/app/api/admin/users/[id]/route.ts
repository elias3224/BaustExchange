// src/app/api/admin/users/[id]/route.ts
// Admin: change a user's role or status (promote / block / unblock).
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';
import { userUpdateSchema } from '@/lib/validations';
import { createNotification } from '@/lib/notifications';
import { logActivity, ActivityType } from '@/lib/activity';
import { NotificationType } from '@prisma/client';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    // Safety: an admin cannot demote or block themselves.
    if (id === admin.id && (parsed.data.role === 'student' || parsed.data.role === 'teacher' || parsed.data.status === 'blocked')) {
      return NextResponse.json({ error: 'You cannot demote or block your own account.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const data: any = {};
    if (parsed.data.role) data.role = parsed.data.role;
    if (parsed.data.status) data.status = parsed.data.status;
    if (parsed.data.department !== undefined) data.department = parsed.data.department || null;
    if (parsed.data.studentId !== undefined) data.studentId = parsed.data.studentId || null;
    if (parsed.data.phone !== undefined) data.phone = parsed.data.phone || null;

    const updated = await prisma.user.update({ where: { id }, data });

    if (parsed.data.status === 'blocked') {
      await createNotification(id, NotificationType.ADMIN, 'Your account has been blocked by an admin.');
    } else if (parsed.data.status === 'active') {
      await createNotification(id, NotificationType.ADMIN, 'Your account has been unblocked.');
    } else if (parsed.data.role) {
      await createNotification(id, NotificationType.ADMIN, `Your role was changed to "${parsed.data.role}".`);
    }

    await logActivity(ActivityType.ADMIN_ROLE, `Updated user ${target.email} (role/status)`, admin.id);
    return NextResponse.json({
      id: updated.id,
      role: updated.role,
      status: updated.status,
    });
  } catch (err) {
    console.error('PATCH /api/admin/users/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}