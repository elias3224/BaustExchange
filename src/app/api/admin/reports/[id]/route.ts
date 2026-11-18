// src/app/api/admin/reports/[id]/route.ts
// Admin: review / resolve / dismiss a report.
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/authz';
import { logActivity, ActivityType } from '@/lib/activity';
import { ReportStatus } from '@prisma/client';
import { logAdminAction } from '@/lib/audit';
import { clientIp } from '@/lib/ratelimit';

const STATUSES: ReportStatus[] = ['reviewed', 'resolved', 'dismissed'];

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
    const status = body.status as ReportStatus;
    if (!STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status. Use reviewed | resolved | dismissed.' }, { status: 400 });
    }

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return NextResponse.json({ error: 'Report not found' }, { status: 404 });

    const updated = await prisma.report.update({ where: { id }, data: { status } });

    await logActivity(ActivityType.ADMIN_ROLE, `Report ${id} marked ${status}`, admin.id);

    const ip = clientIp(req);
    const userAgent = req.headers.get('user-agent');
    await logAdminAction({
      adminId: admin.id,
      adminName: admin.name || 'Admin',
      adminEmail: admin.email || 'admin@baust.edu',
      actionType: 'report_resolved',
      targetUserId: report.reportedUserId || report.reporterId,
      previousValue: report.status,
      newValue: status,
      reason: body.reason || `Report for ${report.reason} marked ${status}`,
      ipAddress: ip,
      userAgent,
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error('PATCH /api/admin/reports/[id] error:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}