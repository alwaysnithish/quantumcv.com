import { redirect } from 'next/navigation';
import { getCurrentUserId } from '@/lib/session';
import { getUserById, displayName, avatarInitials } from '@/lib/users';
import { db } from '@/db/client';
import { resumes } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { atsLabel, parseGeneratedData } from '@/lib/resumes';
import DashboardClient from './dashboard-client';

export default async function DashboardPage() {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');

  const user = await getUserById(userId);
  if (!user) redirect('/login');

  const all = await db
    .select()
    .from(resumes)
    .where(eq(resumes.userId, userId))
    .orderBy(desc(resumes.updatedAt));

  const atsScores = all.map((r) => r.atsScore).filter((s): s is number => !!s);
  const stats = {
    total: all.length,
    generated: all.filter((r) => r.status === 'generated').length,
    exported: all.filter((r) => r.status === 'exported').length,
    avgAts: atsScores.length ? Math.round(atsScores.reduce((a, b) => a + b, 0) / atsScores.length) : 0,
  };

  const resumeList = all.slice(0, 20).map((r) => {
    const data = parseGeneratedData(r);
    return {
      id: r.id,
      title: r.title,
      targetRole: r.targetRole,
      country: r.country,
      status: r.status,
      atsScore: r.atsScore ?? 0,
      atsLabel: atsLabel(r.atsScore),
      updatedAt: r.updatedAt,
      previewData: data,
      templateId: data?.layout_config?.template_id || 'classic-clean',
      accent: data?.layout_config?.accent_color || '#2058e8',
    };
  });

  return (
    <DashboardClient
      userName={displayName(user)}
      userInitials={avatarInitials(user)}
      credits={user.credits}
      isStaff={user.isStaff}
      stats={stats}
      resumes={resumeList}
    />
  );
}
