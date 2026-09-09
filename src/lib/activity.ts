import prisma from '@/lib/prisma';
import { Activity } from '@prisma/client';

/**
 * Record an activity event. `userId` may be null for system actions.
 *
 * @param action      short identifier e.g. "login", "listing_created"
 * @param description human-readable description
 * @param userId      the user the action relates to (optional)
 * @param ipAddress   the IP address of the actor (optional)
 */
export async function logActivity(
  action: string,
  description: string,
  userId?: string | null,
  ipAddress?: string | null
): Promise<Activity> {
  try {
    return await prisma.activity.create({
      data: {
        action,
        description,
        userId: userId ?? undefined,
        ipAddress: ipAddress ?? undefined,
      },
    });
  } catch (err) {
    console.error('logActivity error:', err);
    // Re-throw nothing - activity logging must never break a request.
    return {} as Activity;
  }
}

/**
 * Convenience helpers for common activity types.
 */
export const ActivityType = {
  LOGIN: 'login',
  REGISTER: 'registration',
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  LISTING_DELETED: 'listing_deleted',
  REQUEST_CREATED: 'request_created',
  REQUEST_ACCEPTED: 'request_accepted',
  REQUEST_REJECTED: 'request_rejected',
  REQUEST_CANCELLED: 'request_cancelled',
  REQUEST_COMPLETED: 'request_completed',
  REPORT_CREATED: 'report_created',
  ADMIN_ROLE: 'admin_action',
} as const;
