// src/lib/pro.ts
import prisma from '@/lib/prisma';

export function isUserPro(user?: {
  subscriptionPlan?: string | null;
  subscriptionExpires?: Date | string | null;
  role?: string | null;
  isSuperAdmin?: boolean | null;
} | null): boolean {
  if (!user) return false;
  // Super Admins & Admins always have access for testing & management
  if (user.role === 'admin' || user.isSuperAdmin) return true;
  if (user.subscriptionPlan !== 'pro') return false;
  if (!user.subscriptionExpires) return false;

  const expiresAt = new Date(user.subscriptionExpires).getTime();
  return expiresAt > Date.now();
}

export type ProFeature =
  | 'audio_call'
  | 'video_call'
  | 'audio_video_call'
  | 'gps_location'
  | 'ai_listing'
  | 'premium_pin';

export async function checkProEntitlement(
  userId: string,
  feature?: ProFeature
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        isSuperAdmin: true,
        subscriptionPlan: true,
        subscriptionExpires: true,
      },
    });

    if (!user) {
      return { allowed: false, reason: 'User not found.' };
    }

    if (user.role === 'admin' || user.isSuperAdmin) {
      return { allowed: true };
    }

    if (user.subscriptionPlan !== 'pro') {
      return {
        allowed: false,
        reason: 'Campus PRO subscription required for this feature.',
      };
    }

    if (!user.subscriptionExpires || new Date(user.subscriptionExpires).getTime() <= Date.now()) {
      return {
        allowed: false,
        reason: 'Your Campus PRO subscription has expired. Please renew.',
      };
    }

    return { allowed: true };
  } catch (err) {
    console.error('checkProEntitlement error:', err);
    return { allowed: false, reason: 'Failed to verify entitlement.' };
  }
}
