import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import BuilderClient from './builder-client';

export default async function NewBuilderPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  return <BuilderClient resumeId={null} initialData={null} initialRaw="" initialRole="Software Engineer" initialCountry="India" initialJobDescription="" />;
}
