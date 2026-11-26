import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/lib/users';
import AdminClient from './admin-client';

export default async function AdminPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const user = await getUserById(userId);
  // Deliberately redirect to /dashboard (not a distinct "forbidden" page) for
  // non-admins — don't reveal that an admin area exists to regular users.
  if (!user || !user.isStaff) redirect('/dashboard');

  return <AdminClient adminName={user.fullName || user.email} />;
}
