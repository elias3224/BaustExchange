'use client';

import React from 'react';
import { isActualProSubscription } from '@/lib/pro';

export interface ProAvatarProps {
  user?: {
    name?: string | null;
    image?: string | null;
    subscriptionPlan?: string | null;
    subscriptionExpires?: Date | string | null;
    role?: string | null;
    isSuperAdmin?: boolean | null;
    isVerifiedSeller?: boolean | null;
  } | null;
  src?: string | null;
  name?: string | null;
  isPro?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showBadge?: boolean;
  className?: string;
}

const SIZES = {
  xs: { ring: 'p-[1.5px]', img: 'w-6 h-6', badge: 'text-[8px] -bottom-1 -right-1 px-1' },
  sm: { ring: 'p-[2px]', img: 'w-8 h-8', badge: 'text-[8px] -bottom-1 -right-1 px-1' },
  md: { ring: 'p-[2.5px]', img: 'w-10 h-10', badge: 'text-[9px] -bottom-1.5 -right-1 px-1.5' },
  lg: { ring: 'p-[3px]', img: 'w-12 h-12', badge: 'text-[10px] -bottom-1.5 -right-1 px-1.5' },
  xl: { ring: 'p-[3.5px]', img: 'w-16 h-16', badge: 'text-[10px] -bottom-2 -right-1 px-2' },
};

export function ProAvatar({
  user,
  src,
  name,
  isPro,
  size = 'md',
  showBadge = true,
  className = '',
}: ProAvatarProps) {
  const effectiveIsPro = isPro !== undefined ? isPro : isActualProSubscription(user);
  const effectiveImage = src !== undefined ? src : user?.image;
  const effectiveName = name !== undefined ? name : user?.name;

  const sizeConfig = SIZES[size] || SIZES.md;
  const initial = effectiveName ? effectiveName.charAt(0).toUpperCase() : 'U';

  const avatarElement = effectiveImage ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={effectiveImage}
      alt={effectiveName || 'User'}
      className={`${sizeConfig.img} rounded-full object-cover shrink-0`}
    />
  ) : (
    <div
      className={`${sizeConfig.img} rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-bold shrink-0 text-xs sm:text-sm`}
    >
      {initial}
    </div>
  );

  if (!effectiveIsPro) {
    return (
      <div className={`relative inline-flex shrink-0 ${className}`}>
        {avatarElement}
      </div>
    );
  }

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {/* Gemini Pro-inspired vibrant multi-gradient circular ring */}
      <div
        className={`${sizeConfig.ring} rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-500 shadow-xs transition-transform hover:scale-105`}
      >
        <div className="rounded-full bg-white p-[1.5px]">
          {avatarElement}
        </div>
      </div>

      {showBadge && (
        <span
          className={`absolute ${sizeConfig.badge} font-black uppercase tracking-wider bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full shadow-xs border border-white leading-tight flex items-center justify-center`}
        >
          PRO
        </span>
      )}
    </div>
  );
}
