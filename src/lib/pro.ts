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
  return !isNaN(expiresAt) && expiresAt > Date.now();
}

/**
 * Checks if a user has an active paid Campus PRO subscription.
 * Strictly checks actual PRO plan and expiry without granting admin bypass.
 */
export function isActualProSubscription(user?: {
  subscriptionPlan?: string | null;
  subscriptionExpires?: Date | string | null;
} | null): boolean {
  if (!user) return false;
  if (user.subscriptionPlan !== 'pro') return false;
  if (!user.subscriptionExpires) return false;

  const expiresAt = new Date(user.subscriptionExpires).getTime();
  return !isNaN(expiresAt) && expiresAt > Date.now();
}

export type ProSubscriptionStatus = 'active' | 'expiring_soon' | 'expired' | 'none';

export function getProSubscriptionStatus(user?: {
  subscriptionPlan?: string | null;
  subscriptionExpires?: Date | string | null;
} | null): ProSubscriptionStatus {
  if (!user || user.subscriptionPlan !== 'pro' || !user.subscriptionExpires) {
    return 'none';
  }

  const expiresAt = new Date(user.subscriptionExpires).getTime();
  if (isNaN(expiresAt) || expiresAt <= Date.now()) {
    return 'expired';
  }

  const daysRemaining = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
  if (daysRemaining <= 3) {
    return 'expiring_soon';
  }

  return 'active';
}

export function getRemainingDays(expiresAt?: Date | string | null): number {
  if (!expiresAt) return 0;
  const expTime = new Date(expiresAt).getTime();
  if (isNaN(expTime)) return 0;
  return Math.max(0, Math.ceil((expTime - Date.now()) / (1000 * 60 * 60 * 24)));
}

export function getDaysSinceActivation(startedAt?: Date | string | null): number {
  if (!startedAt) return 0;
  const startTime = new Date(startedAt).getTime();
  if (isNaN(startTime)) return 0;
  return Math.max(0, Math.floor((Date.now() - startTime) / (1000 * 60 * 60 * 24)));
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
