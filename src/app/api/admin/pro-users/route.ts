import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import {
  isActualProSubscription,
  getProSubscriptionStatus,
  getRemainingDays,
  getDaysSinceActivation,
} from '@/lib/pro';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await currentUser(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim().toLowerCase();
  const filter = searchParams.get('filter') || 'all'; // all | active | expired | expiring_soon
  const sort = searchParams.get('sort') || 'expiry_desc';

  const now = new Date();
  const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  try {
    // 1. Auto-sync any expired PRO subscriptions in database
    await prisma.user.updateMany({
      where: {
        subscriptionPlan: 'pro',
        subscriptionExpires: { lte: now },
        subscriptionStatus: { not: 'expired' },
      },
      data: {
        subscriptionStatus: 'expired',
      },
    });

    // 2. Fetch all users who have had PRO or have subscription records
    const proUsers = await prisma.user.findMany({
      where: {
        OR: [
          { subscriptionPlan: 'pro' },
          { subscriptionStatus: { in: ['active', 'expired', 'expiring_soon'] } },
          { subscriptionStartedAt: { not: null } },
          { subscriptionHistories: { some: {} } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        department: true,
        studentId: true,
        isVerifiedSeller: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartedAt: true,
        subscriptionExpires: true,
        createdAt: true,
        subscriptionHistories: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Compute live PRO statistics
    let totalProUsers = proUsers.length;
    let activeProUsers = 0;
    let expiredProUsers = 0;
    let expiringSoonUsers = 0;
    let newlyUpgradedUsers = 0;

    const mappedUsers = proUsers.map((u) => {
      const isActive = isActualProSubscription(u);
      const status = getProSubscriptionStatus(u);
      const remainingDays = getRemainingDays(u.subscriptionExpires);
      const daysSinceActivation = getDaysSinceActivation(u.subscriptionStartedAt);

      if (isActive) {
        activeProUsers++;
        if (u.subscriptionExpires && new Date(u.subscriptionExpires) <= threeDaysFromNow) {
          expiringSoonUsers++;
        }
      } else if (u.subscriptionPlan === 'pro' || u.subscriptionStatus === 'expired') {
        expiredProUsers++;
      }

      if (u.subscriptionStartedAt && new Date(u.subscriptionStartedAt) >= sevenDaysAgo) {
        newlyUpgradedUsers++;
      }

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image,
        role: u.role,
        department: u.department,
        studentId: u.studentId,
        isVerifiedSeller: u.isVerifiedSeller,
        subscriptionPlan: u.subscriptionPlan,
        subscriptionStatus: status,
        proStartDate: u.subscriptionStartedAt,
        daysSinceActivation,
        proExpiryDate: u.subscriptionExpires,
        remainingDays,
        isPro: isActive,
        createdAt: u.createdAt,
        historyCount: u.subscriptionHistories.length,
        latestHistory: u.subscriptionHistories[0] || null,
      };
    });

    // 4. Apply filter
    let filtered = mappedUsers;
    if (filter === 'active') {
      filtered = filtered.filter((u) => u.isPro);
    } else if (filter === 'expired') {
      filtered = filtered.filter((u) => !u.isPro && (u.subscriptionPlan === 'pro' || u.subscriptionStatus === 'expired'));
    } else if (filter === 'expiring_soon') {
      filtered = filtered.filter((u) => u.subscriptionStatus === 'expiring_soon');
    }

    // 5. Apply search query
    if (q) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.studentId && u.studentId.toLowerCase().includes(q)) ||
          (u.department && u.department.toLowerCase().includes(q))
      );
    }

    // 6. Apply sorting
    if (sort === 'expiry_asc') {
      filtered.sort((a, b) => {
        const timeA = a.proExpiryDate ? new Date(a.proExpiryDate).getTime() : 0;
        const timeB = b.proExpiryDate ? new Date(b.proExpiryDate).getTime() : 0;
        return timeA - timeB;
      });
    } else if (sort === 'expiry_desc') {
      filtered.sort((a, b) => {
        const timeA = a.proExpiryDate ? new Date(a.proExpiryDate).getTime() : 0;
        const timeB = b.proExpiryDate ? new Date(b.proExpiryDate).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sort === 'start_desc') {
      filtered.sort((a, b) => {
        const timeA = a.proStartDate ? new Date(a.proStartDate).getTime() : 0;
        const timeB = b.proStartDate ? new Date(b.proStartDate).getTime() : 0;
        return timeB - timeA;
      });
    } else if (sort === 'name_asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    return NextResponse.json({
      stats: {
        totalProUsers,
        activeProUsers,
        expiredProUsers,
        expiringSoonUsers,
        newlyUpgradedUsers,
      },
      users: filtered,
    });
  } catch (err: any) {
    console.error('GET /api/admin/pro-users error:', err);
    return NextResponse.json({ error: 'Failed to fetch PRO users' }, { status: 500 });
  }
}

// POST: Manual Upgrade of any user to PRO
export async function POST(req: NextRequest) {
  const admin = await currentUser(req);
  if (!admin || admin.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: Admin role required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, userEmail, durationDays = 30, startDate, expiryDate, adminNotes } = body;

    let targetUser = null;
    if (userId) {
      targetUser = await prisma.user.findUnique({ where: { id: userId } });
    } else if (userEmail) {
      targetUser = await prisma.user.findUnique({ where: { email: userEmail.toLowerCase().trim() } });
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let end: Date;

    if (expiryDate) {
      end = new Date(expiryDate);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + Number(durationDays || 30));
    }

    const previousPlan = targetUser.subscriptionPlan;
    const previousExpires = targetUser.subscriptionExpires;

    // 1. Update user to active PRO
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active',
        subscriptionStartedAt: start,
        subscriptionExpires: end,
      },
    });

    // 2. Record SubscriptionHistory
    await prisma.subscriptionHistory.create({
      data: {
        userId: targetUser.id,
        plan: 'pro',
        packageDuration: Number(durationDays || 30),
        startDate: start,
        endDate: end,
        status: 'active',
        action: 'manual_upgrade',
        adminId: admin.id,
        adminNotes: adminNotes || 'Manual upgrade by administrator',
      },
    });

    // 3. Record AdminAuditLog
    await prisma.adminAuditLog.create({
      data: {
        adminId: admin.id,
        adminName: admin.name || 'Admin',
        adminEmail: admin.email || 'admin@baust.edu.bd',
        actionType: 'SUBSCRIPTION_MANUAL_UPGRADE',
        targetUserId: targetUser.id,
        targetEmail: targetUser.email,
        previousValue: JSON.stringify({ plan: previousPlan, expires: previousExpires }),
        newValue: JSON.stringify({ plan: 'pro', starts: start, expires: end }),
        reason: adminNotes || 'Admin manual PRO upgrade',
        result: 'success',
      },
    });

    // 4. Send notification to user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: 'ADMIN',
        message: `✨ Your Campus PRO subscription has been activated by Administration! Valid until ${end.toLocaleDateString()}.`,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err: any) {
    console.error('POST /api/admin/pro-users manual upgrade error:', err);
    return NextResponse.json({ error: err.message || 'Failed to upgrade user' }, { status: 500 });
  }
}
