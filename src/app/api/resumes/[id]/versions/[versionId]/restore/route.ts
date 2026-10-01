import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes, resumeVersions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getResumeForUser, createVersion } from '@/lib/resumes';

type Params = { params: Promise<{ id: string; versionId: string }> };

/** POST /api/resumes/[id]/versions/[versionId]/restore — port of restore_version */
export async function POST(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id, versionId } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(and(eq(resumeVersions.id, Number(versionId)), eq(resumeVersions.resumeId, id)))
    .limit(1);

  if (!version) return NextResponse.json({ success: false, message: 'Version not found.' }, { status: 404 });

  // Snapshot current state before restoring
  await createVersion(id, 'Before restore');

  await db
    .update(resumes)
    .set({ generatedData: version.snapshotData, updatedAt: new Date().toISOString() })
    .where(eq(resumes.id, id));

  return NextResponse.json({ success: true, data: JSON.parse(version.snapshotData) });
}
