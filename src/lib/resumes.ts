import { db } from '@/db/client';
import { resumes, resumeVersions } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export async function getResumeForUser(resumeId: string, userId: string) {
  const [resume] = await db
    .select()
    .from(resumes)
    .where(and(eq(resumes.id, resumeId), eq(resumes.userId, userId)))
    .limit(1);
  return resume ?? null;
}

export function parseGeneratedData(resume: { generatedData: string | null }): any | null {
  if (!resume.generatedData) return null;
  try {
    return JSON.parse(resume.generatedData);
  } catch {
    return null;
  }
}

/** mirrors Resume.create_version() in resume/models.py */
export async function createVersion(resumeId: string, label = '') {
  const [resume] = await db.select().from(resumes).where(eq(resumes.id, resumeId)).limit(1);
  if (!resume?.generatedData) return null;

  const [last] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, resumeId))
    .orderBy(desc(resumeVersions.versionNumber))
    .limit(1);

  const versionNumber = last ? last.versionNumber + 1 : 1;

  await db.insert(resumeVersions).values({
    resumeId,
    versionNumber,
    snapshotData: resume.generatedData,
    label: label || `Version ${versionNumber}`,
  });

  return versionNumber;
}

/** mirrors Resume.ats_label property */
export function atsLabel(atsScore: number | null): string {
  const score = atsScore ?? 0;
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 50) return 'Fair';
  return 'Needs Work';
}

export function newResumeId(): string {
  return randomUUID();
}
