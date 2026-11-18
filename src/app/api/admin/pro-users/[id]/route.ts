import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await currentUser(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { id } = await params;

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpires: true,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { action, durationDays = 30, startDate, expiryDate, adminNotes } = body;

    const previousData = {
      plan: targetUser.subscriptionPlan,
      status: targetUser.subscriptionStatus,
      starts: targetUser.subscriptionStartedAt,
      expires: targetUser.subscriptionExpires,
    };

    let newPlan = targetUser.subscriptionPlan;
    let newStatus = targetUser.subscriptionStatus;
    let newStarts = targetUser.subscriptionStartedAt || new Date();
    let newExpires = targetUser.subscriptionExpires || new Date();
    let actionLabel = action;

    const now = new Date();

    if (action === 'renew') {
      newPlan = 'pro';
      newStatus = 'active';
      newStarts = now;
      const baseDate = targetUser.subscriptionExpires && new Date(targetUser.subscriptionExpires) > now
        ? new Date(targetUser.subscriptionExpires)
        : now;
      newExpires = new Date(baseDate);
      newExpires.setDate(newExpires.getDate() + Number(durationDays || 30));
      actionLabel = 'renew';
    } else if (action === 'extend') {
      newPlan = 'pro';
      newStatus = 'active';
      const baseDate = targetUser.subscriptionExpires && new Date(targetUser.subscriptionExpires) > now
        ? new Date(targetUser.subscriptionExpires)
        : now;
      newExpires = new Date(baseDate);
      newExpires.setDate(newExpires.getDate() + Number(durationDays || 7));
      actionLabel = 'extension';
    } else if (action === 'expire_early') {
      newStatus = 'expired';
      newExpires = now; // Expire immediately
      actionLabel = 'early_expiration';
    } else if (action === 'set_dates') {
      newPlan = 'pro';
      if (startDate) newStarts = new Date(startDate);
      if (expiryDate) newExpires = new Date(expiryDate);
      newStatus = newExpires > now ? 'active' : 'expired';
      actionLabel = 'admin_override';
    } else {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    // 1. Update user
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        subscriptionPlan: newPlan,
        subscriptionStatus: newStatus,
        subscriptionStartedAt: newStarts,
        subscriptionExpires: newExpires,
      },
    });

    // 2. Insert into SubscriptionHistory
    await prisma.subscriptionHistory.create({
      data: {
        userId: targetUser.id,
        plan: newPlan,
        packageDuration: Number(durationDays || 30),
        startDate: newStarts,
        endDate: newExpires,
        status: newStatus,
        action: actionLabel,
        adminId: admin.id,
        adminNotes: adminNotes || `Subscription ${actionLabel} by administrator`,
      },
    });

    // 3. Record AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name || 'Admin',
        adminEmail: admin.email || 'admin@baust.edu.bd',
        actionType: `SUBSCRIPTION_${actionLabel.toUpperCase()}`,
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        previousValue: JSON.stringify(previousData),
        newValue: JSON.stringify({
          plan: newPlan,
          status: newStatus,
          starts: newStarts,
          expires: newExpires,
        }),
        reason: adminNotes || `Admin action: ${actionLabel}`,
        result: 'success',
      },
    });

    // 4. Send notification to user
    const notifMsg =
      action === 'expire_early'
        ? 'Your Campus PRO subscription has been concluded by Administration.'
        : `Your Campus PRO subscription has been updated! Expiry date: ${newExpires.toLocaleDateString()}.`;

    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'ADMIN',
        message: notifMsg,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('PATCH /api/admin/pro-users/[id] error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update subscription' }, { status: 500 });
  }
}
