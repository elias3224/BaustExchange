// src/app/api/admin/listings/[id]/route.ts
// Admin: approve / reject / remove a listing.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';
import { createNotification } from '@/lib/notifications';
import { logActivity, ActivityType } from '@/lib/activity';
import { ListingStatus, NotificationType } from '@prisma/client';

const ACTION_STATUS: Record<string, ListingStatus> = {
  approve: 'active',
  reject: 'rejected',
  remove: 'removed',
};

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
    const action: string = body.action;
    const status = ACTION_STATUS[action];
    if (!status) {
      return NextResponse.json({ error: 'Invalid action. Use approve | reject | remove.' }, { status: 400 });
    }

    const listing = await prisma.listing.findUnique({ where: { id } });
    if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 });

    const updated = await prisma.listing.update({ where: { id }, data: { status } });

    // Notify the owner about the decision.
    if (action === 'approve') {
      await createNotification(
        listing.userId,
        NotificationType.LISTING_APPROVED,
        `Your listing "${listing.title}" has been approved and is now live.`,
        listing.id
      );
    } else if (action === 'reject') {
      await createNotification(
        listing.userId,
        NotificationType.ADMIN,
        `Your listing "${listing.title}" was rejected by an admin.`,
        listing.id
      );
    }

    await logActivity(
      ActivityType.ADMIN_ROLE,
      `${action}d listing "${listing.title}"`,
      admin.id
    );
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/admin/listings/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}