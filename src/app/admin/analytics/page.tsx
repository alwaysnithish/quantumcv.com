import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/lib/users';
import AnalyticsClient from './analytics-client';

export const metadata = { title: 'Analytics', robots: { index: false, follow: false } };

export default async function AnalyticsPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const user = await getUserById(userId);
  // Same rule as /admin: non-admins are bounced without revealing the page exists.
  if (!user || !user.isStaff) redirect('/dashboard');
  return <AnalyticsClient />;
}
