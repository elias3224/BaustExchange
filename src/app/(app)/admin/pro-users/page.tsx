import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/authz';
import { ProUsersManagement } from '@/components/admin/ProUsersManagement';

export const dynamic = 'force-dynamic';

export default async function AdminProUsersPage() {
  const user = await currentUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'admin') {
    redirect('/dashboard');
  }

  return <ProUsersManagement />;
}
