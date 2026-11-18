// src/app/(app)/profile/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { RoleBadge } from '@/components/ui/SessionContext';
import { ProAvatar } from '@/components/ui/ProAvatar';
import { timeAgo } from '@/lib/utils';
import { Sparkles, Calendar, BookOpen, GraduationCap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const sessionUser = await currentUser();
  if (!sessionUser) return null;

  const [user, listingsCount, requestsCount, completedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        isVerifiedSeller: true,
        department: true,
        studentId: true,
        phone: true,
        batch: true,
        bio: true,
        idCardStatus: true,
        idCardUrl: true,
        idCardRejectReason: true,
        subscriptionPlan: true,
        subscriptionExpires: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    }),
    prisma.listing.count({ where: { userId: sessionUser.id } }),
    prisma.exchangeRequest.count({
      where: { OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }] },
    }),
    prisma.exchangeRequest.count({
      where: {
        OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }],
        status: 'completed',
      },
    }),
  ]);

  if (!user) return null;

  const isPro =
    user.subscriptionPlan === 'pro' &&
    user.subscriptionExpires &&
    new Date(user.subscriptionExpires).getTime() > Date.now();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
        {isPro && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white rounded-full text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            Campus PRO Active
          </span>
        )}
      </div>

      {/* Overview card with Pro Avatar ring & identity */}
      <div className="border border-gray-200 rounded-2xl bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5 text-center sm:text-left">
          <ProAvatar user={user} size="xl" showBadge={true} />
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold text-gray-900 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span>{user.name}</span>
              <RoleBadge role={user.role} />
              {user.isSuperAdmin && (
                <span className="text-[11px] bg-red-100 text-red-800 font-extrabold px-2 py-0.5 rounded-full">
                  ★ Super Admin
                </span>
              )}
              {user.isVerifiedSeller && (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ✓ BAUST Verified
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400">Joined {timeAgo(user.createdAt)}</div>

            {/* Quick meta row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-gray-500 mt-2.5">
              {user.department && (
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-gray-400" />
                  {user.department}
                </span>
              )}
              {user.batch && (
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {user.batch}
                </span>
              )}
              {user.studentId && (
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                  ID: {user.studentId}
                </span>
              )}
            </div>

            {user.bio && (
              <p className="text-xs text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg italic">
                &ldquo;{user.bio}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-6 text-center border-t border-gray-100 pt-5">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-brand-700">{listingsCount}</div>
            <div className="text-xs text-gray-500 font-medium">Listings</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-brand-700">{requestsCount}</div>
            <div className="text-xs text-gray-500 font-medium">Requests</div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-lg sm:text-xl font-bold text-brand-700">{completedCount}</div>
            <div className="text-xs text-gray-500 font-medium">Completed</div>
          </div>
        </div>
      </div>

      {/* Editable details with "Edit Profile" toggle & BAUST ID verification */}
      <ProfileForm
        initial={{
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          department: user.department,
          studentId: user.studentId,
          phone: user.phone,
          batch: user.batch,
          bio: user.bio,
          role: user.role,
          isVerifiedSeller: user.isVerifiedSeller,
          idCardStatus: user.idCardStatus,
          idCardUrl: user.idCardUrl,
          idCardRejectReason: user.idCardRejectReason,
        }}
      />
    </div>
  );
}
