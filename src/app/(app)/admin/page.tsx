import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { AdminListingRow, AdminReportRow, AdminUserRow, AdminPaymentRow, AdminIdCardRow } from '@/components/admin/AdminPanels';
import { Package, Flag, Users, CreditCard, IdCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return null;
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [stats, pendingListings, reports, users, payments, pendingIdCards] = await Promise.all([
    Promise.all([
      prisma.listing.count({ where: { status: 'pending' } }),
      prisma.listing.count({ where: { status: 'active' } }),
      prisma.user.count(),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.payment.count({ where: { status: 'pending' } }),
      prisma.user.count({ where: { idCardStatus: 'pending' } }),
    ]),
    prisma.listing.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      take: 20,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true, name: true, email: true, image: true, role: true, status: true,
        department: true, createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { idCardStatus: 'pending' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true, name: true, email: true, role: true, department: true, studentId: true,
        idCardUrl: true, idCardOcrNote: true, updatedAt: true,
      },
    }),
  ]);

  const [pendingCount, activeCount, userCount, pendingReports, pendingPayments, pendingIdCount] = stats;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[
          { label: 'Pending Payments', value: pendingPayments, icon: <CreditCard className="w-5 h-5" /> },
          { label: 'Pending IDs', value: pendingIdCount, icon: <IdCard className="w-5 h-5" /> },
          { label: 'Pending Listings', value: pendingCount, icon: <Package className="w-5 h-5" /> },
          { label: 'Active Listings', value: activeCount, icon: <Package className="w-5 h-5" /> },
          { label: 'Users', value: userCount, icon: <Users className="w-5 h-5" /> },
          { label: 'Pending Reports', value: pendingReports, icon: <Flag className="w-5 h-5" /> },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 p-3 sm:p-4 bg-white border border-gray-200 rounded-md min-w-0">
            <div className="text-brand-500 shrink-0">{s.icon}</div>
            <div className="min-w-0">
              <div className="text-xl font-bold">{s.value}</div>
              <div className="text-xs text-gray-500 truncate">{s.label}</div>
            </div>
          </div>
        ))}
      </section>

      {/* ID Card Verification Requests */}
      <section>
        <h2 className="text-lg font-semibold mb-3">ID Card Verification Requests</h2>
        {pendingIdCards.length === 0 ? (
          <p className="text-sm text-gray-500">No ID cards awaiting review.</p>
        ) : (
          <div className="space-y-3">
            {pendingIdCards.map((u) => <AdminIdCardRow key={u.id} user={u as any} />)}
          </div>
        )}
      </section>

      {/* Payments */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Subscription & Pin Payments</h2>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-500">No payment submissions yet.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => <AdminPaymentRow key={p.id} payment={p as any} />)}
          </div>
        )}
      </section>

      {/* Pending listings */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Listings Awaiting Approval</h2>
        {pendingListings.length === 0 ? (
          <p className="text-sm text-gray-500">Nothing pending.</p>
        ) : (
          <div className="space-y-3">
            {pendingListings.map((l) => <AdminListingRow key={l.id} listing={l as any} />)}
          </div>
        )}
      </section>

      {/* Reports */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-500">No reports filed.</p>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => <AdminReportRow key={r.id} report={r as any} />)}
          </div>
        )}
      </section>

      {/* Users */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Users</h2>
        <div className="border border-gray-200 rounded-md bg-white divide-y divide-gray-100">
          {users.map((u) => <AdminUserRow key={u.id} user={u as any} currentAdminId={user.id} />)}
        </div>
      </section>
    </div>
  );
}