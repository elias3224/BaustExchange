// src/app/api/admin/users/[id]/route.ts
// Admin: change a user's role or status (promote / block / unblock), or delete a user.
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

    // ID card verification actions (only admins reach this route).
    if (parsed.data.idCardAction === 'approve') {
      data.isVerifiedSeller = true;
      data.idCardStatus = 'approved';
      data.idCardVerifiedAt = new Date();
      data.idCardRejectReason = null;
    } else if (parsed.data.idCardAction === 'reject') {
      data.isVerifiedSeller = false;
      data.idCardStatus = 'rejected';
      data.idCardRejectReason =
        parsed.data.idCardRejectReason || 'ID card could not be verified. Please upload again.';
    }

    const updated = await prisma.user.update({ where: { id }, data });

    if (parsed.data.idCardAction === 'approve') {
      await createNotification(
        id,
        NotificationType.ADMIN,
        '✅ Your BAUST ID card was approved! You now have full marketplace access.'
      );
    } else if (parsed.data.idCardAction === 'reject') {
      await createNotification(
        id,
        NotificationType.ADMIN,
        `❌ Your BAUST ID card was rejected: ${data.idCardRejectReason}`
      );
    } else if (parsed.data.status === 'blocked') {
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

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const { id } = await params;

    // Safety: an admin cannot delete their own account.
    if (id === admin.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // 1. Delete requests where user is sender or receiver
      await tx.exchangeRequest.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      });

      // 2. Delete messages where user is sender or receiver
      await tx.message.deleteMany({
        where: { OR: [{ senderId: id }, { receiverId: id }] },
      });

      // 3. Delete notifications
      await tx.notification.deleteMany({
        where: { userId: id },
      });

      // 4. Delete reports made by or against user
      await tx.report.deleteMany({
        where: { OR: [{ reporterId: id }, { reportedUserId: id }] },
      });

      // 5. Delete wanted items
      await tx.wantedItem.deleteMany({
        where: { userId: id },
      });

      // 6. Delete payments
      await tx.payment.deleteMany({
        where: { userId: id },
      });

      // 7. Find user's listings to delete child records (requests, messages, reports, images)
      const userListings = await tx.listing.findMany({
        where: { userId: id },
        select: { id: true },
      });
      const listingIds = userListings.map((l) => l.id);

      if (listingIds.length > 0) {
        await tx.exchangeRequest.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.message.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.report.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.listingImage.deleteMany({ where: { listingId: { in: listingIds } } });
        await tx.listing.deleteMany({ where: { id: { in: listingIds } } });
      }

      // 8. Disassociate activities
      await tx.activity.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // 9. Delete user record
      await tx.user.delete({ where: { id } });
    });

    await logActivity(ActivityType.ADMIN_ROLE, `Deleted user account ${target.email} (${target.name})`, admin.id);
    return NextResponse.json({ success: true, message: `User ${target.email} successfully deleted.` });
  } catch (err) {
    console.error('DELETE /api/admin/users/[id] error:', err);
    return NextResponse.json({ error: 'Failed to delete user.' }, { status: 500 });
  }
}