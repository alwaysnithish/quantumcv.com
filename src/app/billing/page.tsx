import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import { getUserById } from '@/lib/users';
import BillingClient from './billing-client';

export default async function BillingPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const user = await getUserById(userId);
  if (!user) redirect('/login');

  return <BillingClient credits={user.credits} premiumUnlocked={user.premiumUnlocked} />;
}
