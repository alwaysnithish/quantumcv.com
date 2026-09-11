import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import ResumeAnalyserClient from './resumeanalyser-client';

export default async function ResumeAnalyserPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/');
  const { resume } = await searchParams;
  const savedResumes = await db.select({ id: resumes.id, title: resumes.title, targetRole: resumes.targetRole, updatedAt: resumes.updatedAt }).from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.updatedAt));
  return <ResumeAnalyserClient resumes={savedResumes} initialResumeId={resume && savedResumes.some((item) => item.id === resume) ? resume : ''} />;
}
