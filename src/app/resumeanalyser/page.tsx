import type { Metadata } from 'next';
import { desc, eq } from 'drizzle-orm';
import { getCurrentUserId } from '@/lib/session';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import ResumeAnalyserClient from './resumeanalyser-client';
import AnalyserLanding from './analyser-landing';

// Both views share this URL, so the metadata describes the public page that
// Google sees. Logged-in users get the tool at the same address.
export const metadata: Metadata = {
  title: 'Free ATS Resume Score Checker for Freshers',
  description:
    'Get an ATS score and a recruiter-style review of your resume, with keyword gaps and specific fixes. Built for freshers and students.',
  alternates: { canonical: '/resumeanalyser' },
  openGraph: {
    type: 'website',
    url: 'https://quantumcv.app/resumeanalyser',
    title: 'Free ATS Resume Score Checker for Freshers — QuantumCV',
    description:
      'Get an ATS score and a recruiter-style review of your resume, with keyword gaps and specific fixes.',
  },
};

export default async function ResumeAnalyserPage({ searchParams }: { searchParams: Promise<{ resume?: string }> }) {
  // If the session lookup fails (for example the database is unreachable),
  // treat the visitor as logged out and show the public page instead of crashing.
  let userId: Awaited<ReturnType<typeof getCurrentUserId>> | null = null;
  try {
    userId = await getCurrentUserId();
  } catch {
    userId = null;
  }

  // Logged out (visitors and Googlebot): public, indexable landing page.
  // No database query runs for these requests.
  if (!userId) return <AnalyserLanding />;

  // Logged in: unchanged behaviour.
  const { resume } = await searchParams;
  const savedResumes = await db
    .select({ id: resumes.id, title: resumes.title, targetRole: resumes.targetRole, updatedAt: resumes.updatedAt })
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt));
  return (
    <ResumeAnalyserClient
      resumes={savedResumes}
      initialResumeId={resume && savedResumes.some((item) => item.id === resume) ? resume : ''}
    />
  );
}
