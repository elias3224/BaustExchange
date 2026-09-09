import prisma from '@/lib/prisma';
import { NotificationType } from '@prisma/client';
import { sendEmail, notificationEmail } from '@/lib/mailer';

/**
 * Create an in-app notification for a user and (optionally) email them.
 *
 * @param toUserId   recipient user id
 * @param type       notification type
 * @param message    human-readable message
 * @param referenceId  id of the related resource (listing / request / message)
 */
export async function createNotification(
  toUserId: string,
  type: NotificationType,
  message: string,
  referenceId?: string
) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: toUserId,
        type,
        message,
        referenceId,
      },
    });

    // Try to email the user if SMTP is configured and the user has a
    // notification-preference (we don't store prefs yet, so always attempt).
    const user = await prisma.user.findUnique({
      where: { id: toUserId },
      select: { email: true },
    });
    if (user?.email) {
      const { subject, html } = notificationEmail(type, message);
      // Fire-and-forget email; failures are logged inside sendEmail.
      sendEmail(user.email, subject, html).catch(() => {});
    }

    return notification;
  } catch (err) {
    console.error('createNotification error:', err);
  }
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllNotificationsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}

/**
 * Count unread notifications for a user (used in the header badge).
 */
export async function unreadNotificationCount(userId: string): Promise<number> {
  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });
  return count;
}
