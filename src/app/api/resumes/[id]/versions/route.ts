import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumeVersions } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { getResumeForUser } from '@/lib/resumes';

type Params = { params: Promise<{ id: string }> };

/** GET /api/resumes/[id]/versions — port of resume/views.py::version_history */
export async function GET(_req: NextRequest, { params }: Params) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;

  const resume = await getResumeForUser(id, auth.id);
  if (!resume) return NextResponse.json({ success: false, message: 'Not found.' }, { status: 404 });

  const versions = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.resumeId, id))
    .orderBy(desc(resumeVersions.versionNumber))
    .limit(15);

  return NextResponse.json({
    versions: versions.map((v) => ({
      id: v.id,
      version_number: v.versionNumber,
      label: v.label,
      created_at: v.createdAt,
    })),
  });
}
