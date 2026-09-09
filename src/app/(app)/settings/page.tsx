// src/app/(app)/settings/page.tsx
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { RoleBadge } from '@/components/ui/SessionContext';
import { timeAgo } from '@/lib/utils';
import { Shield, LogOut, Info } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const sessionUser = await currentUser();
  if (!sessionUser) return null;

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: {
      name: true, email: true, role: true, status: true, createdAt: true,
    },
  });
  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Settings</h1>

      {/* Account */}
      <section className="border border-gray-200 rounded-md bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{user.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <dt className="text-gray-500">Role</dt>
            <dd><RoleBadge role={user.role} /></dd>
          </div>
          <div className="flex justify-between gap-4 items-center">
            <dt className="text-gray-500">Status</dt>
            <dd>
              <span className={`text-xs px-2 py-0.5 rounded ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {user.status}
              </span>
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Signed in via</dt>
            <dd className="font-medium">Google</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-gray-500">Member since</dt>
            <dd className="font-medium">{timeAgo(user.createdAt)}</dd>
          </div>
        </dl>
      </section>

      {/* Admin */}
      {user.role === 'admin' && (
        <section className="border border-purple-200 rounded-md bg-purple-50 p-6">
          <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-600" /> Admin Tools
          </h2>
          <p className="text-sm text-purple-800 mb-3">
            Manage pending listings, review reports and moderate users.
          </p>
          <Link
            href="/admin"
            className="inline-block px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
          >
            Open Admin Panel
          </Link>
        </section>
      )}

      {/* Session */}
      <section className="border border-gray-200 rounded-md bg-white p-6">
        <h2 className="text-lg font-semibold mb-2">Session</h2>
        <p className="text-sm text-gray-500 mb-4">
          Signing out ends your session on this device. You can sign back in with Google at any time.
        </p>
        <Link
          href="/auth/logout"
          className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Link>
      </section>

      {/* Info */}
      <section className="flex gap-3 text-xs text-gray-400 p-2">
        <Info className="w-4 h-4 flex-shrink-0" />
        <p>
          BAUST Exchange is a student-run marketplace and is not an official
          university service. Never send money to strangers - meet on campus
          and inspect items before paying.
        </p>
      </section>
    </div>
  );
}