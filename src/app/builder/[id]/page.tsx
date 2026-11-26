import { redirect, notFound } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import { getResumeForUser, parseGeneratedData } from '@/lib/resumes';
import BuilderClient from '../builder-client';

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const { id } = await params;
  const resume = await getResumeForUser(id, userId);
  if (!resume) notFound();

  return (
    <BuilderClient
      resumeId={resume.id}
      initialData={parseGeneratedData(resume)}
      initialRaw={resume.rawData}
      initialRole={resume.targetRole || 'Software Engineer'}
      initialCountry={resume.country}
      initialJobDescription={resume.jobDescription}
    />
  );
}
