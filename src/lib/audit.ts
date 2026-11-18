import prisma from '@/lib/prisma';

export async function logAdminAction({
  adminId,
  adminName,
  adminEmail,
  actionType,
  targetUserId,
  targetEmail,
  previousValue,
  newValue,
  reason,
  result = 'success',
  ipAddress,
  userAgent,
}: {
  adminId: string;
  adminName: string;
  adminEmail: string;
  actionType: string;
  targetUserId?: string | null;
  targetEmail?: string | null;
  previousValue?: string | null;
  newValue?: string | null;
  reason?: string | null;
  result?: 'success' | 'failure';
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  try {
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminName,
        adminEmail,
        actionType,
        targetUserId: targetUserId || null,
        targetEmail: targetEmail || null,
        previousValue: previousValue || null,
        newValue: newValue || null,
        reason: reason || null,
        result,
        ipAddress: ipAddress || null,
        userAgent: userAgent || null,
      },
    });
  } catch (err) {
    console.error('Failed to write AdminAuditLog:', err);
  }
}
