import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/require-user';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { newResumeId } from '@/lib/resumes';

/** GET /api/resumes — resume list + dashboard stats. Port of resume/views.py::dashboard */
export async function GET() {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const all = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, user.id))
    .orderBy(desc(resumes.updatedAt));

  const atsScores = all.map((r) => r.atsScore).filter((s): s is number => !!s);
  const stats = {
    total: all.length,
    generated: all.filter((r) => r.status === 'generated').length,
    exported: all.filter((r) => r.status === 'exported').length,
    avgAts: atsScores.length
      ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length)
      : 0,
  };

  return NextResponse.json({ resumes: all.slice(0, 20), stats });
}

/** POST /api/resumes — port of resume/views.py::create_resume */
export async function POST(request: NextRequest) {
  const auth = await requireUser();
  if (auth instanceof NextResponse) return auth;
  const user = auth;

  const data = await request.json().catch(() => ({}));
  const id = newResumeId();

  await db.insert(resumes).values({
    id,
    userId: user.id,
    title: data.title ?? 'Untitled Resume',
    targetRole: data.target_role ?? '',
    country: data.country ?? 'India',
    rawData: data.raw_data ?? '',
    jobDescription: data.job_description ?? '',
    status: 'draft',
  });

  return NextResponse.json({ success: true, resume_id: id });
}
