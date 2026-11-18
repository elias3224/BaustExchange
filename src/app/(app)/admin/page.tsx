import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { currentUser } from '@/lib/authz';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) return null;
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  const [stats, pendingListings, activeListings, reports, users, payments, pendingIdCards] = await Promise.all([
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
      take: 30,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.listing.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        category: { select: { name: true } },
        images: { take: 1 },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        reporter: { select: { id: true, name: true, email: true } },
        listing: { select: { id: true, title: true, status: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 60,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        status: true,
        department: true,
        isSuperAdmin: true,
        adminPermissions: true,
        isVerifiedSeller: true,
        subscriptionPlan: true,
        createdAt: true,
        _count: { select: { listings: true } },
      },
    }),
    prisma.payment.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.user.findMany({
      where: { idCardStatus: 'pending' },
      orderBy: { updatedAt: 'desc' },
      take: 30,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        studentId: true,
        idCardUrl: true,
        idCardOcrNote: true,
        updatedAt: true,
      },
    }),
  ]);

  const [pendingCount, activeCount, userCount, pendingReports, pendingPayments, pendingIdCount] = stats;

  return (
    <div className="space-y-6">
      <AdminDashboardClient
        stats={{
          pendingPayments,
          pendingIdCount,
          pendingCount,
          activeCount,
          userCount,
          pendingReports,
        }}
        payments={payments}
        idCards={pendingIdCards}
        pendingListings={pendingListings}
        activeListings={activeListings}
        users={users}
        reports={reports}
        currentUser={{
          id: user.id,
          name: user.name,
          email: user.email,
          isSuperAdmin: (user as any).isSuperAdmin,
          adminPermissions: (user as any).adminPermissions || [],
        }}
      />
    </div>
  );
}
