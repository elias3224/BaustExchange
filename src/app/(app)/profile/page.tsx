// src/app/(app)/profile/page.tsx
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { RoleBadge } from '@/components/ui/SessionContext';
import { timeAgo } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const sessionUser = await currentUser();
  if (!sessionUser) return null;

  const [user, listingsCount, requestsCount, completedCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sessionUser.id },
      select: {
        id: true, name: true, email: true, image: true, role: true, status: true,
        isVerifiedSeller: true, department: true, studentId: true, phone: true, createdAt: true,
      },
    }),
    prisma.listing.count({ where: { userId: sessionUser.id } }),
    prisma.exchangeRequest.count({ where: { OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }] } }),
    prisma.exchangeRequest.count({ where: { OR: [{ senderId: sessionUser.id }, { receiverId: sessionUser.id }], status: 'completed' } }),
  ]);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>

      {/* Overview card */}
      <div className="border border-gray-200 rounded-md bg-white p-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt={user.name} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}
          <div>
            <div className="text-lg font-semibold flex items-center gap-2">
              {user.name} <RoleBadge role={user.role} />
              {user.isVerifiedSeller && (
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  ✓ BAUST Verified
                </span>
              )}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            <div className="text-xs text-gray-400">Joined {timeAgo(user.createdAt)}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 text-center">
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xl font-bold text-brand-700">{listingsCount}</div>
            <div className="text-xs text-gray-500">Listings</div>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xl font-bold text-brand-700">{requestsCount}</div>
            <div className="text-xs text-gray-500">Requests</div>
          </div>
          <div className="bg-gray-50 rounded-md p-3">
            <div className="text-xl font-bold text-brand-700">{completedCount}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>
      </div>

      {/* Editable details */}
      <ProfileForm
        initial={{
          department: user.department ?? '',
          studentId: user.studentId ?? '',
          phone: user.phone ?? '',
          role: user.role,
          isVerifiedSeller: user.isVerifiedSeller,
        }}
      />
    </div>
  );
}