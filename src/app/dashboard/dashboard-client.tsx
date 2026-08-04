'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Trash2,
  FileText,
  Sparkles,
  Download,
  Coins,
  LogOut,
  ArrowUpRight,
} from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import SupportWidget from '@/components/support-widget';
import { TEMPLATES } from '@/lib/resume-canvas/templates';

interface ResumeCard {
  id: string;
  title: string;
  targetRole: string;
  country: string;
  status: string;
  atsScore: number;
  atsLabel: string;
  updatedAt: string;
  previewData: any;
  templateId: string;
  accent: string;
}

interface Stats {
  total: number;
  generated: number;
  exported: number;
  avgAts: number;
}

export default function DashboardClient({
  userName,
  userInitials,
  credits,
  isStaff,
  stats,
  resumes,
}: {
  userName: string;
  userInitials: string;
  credits: number;
  isStaff: boolean;
  stats: Stats;
  resumes: ResumeCard[];
}) {
  const router = useRouter();
  const [list, setList] = useState(resumes);
  const [creating, setCreating] = useState(false);

  async function createResume() {
    setCreating(true);
    try {
      const res = await fetch('/api/resumes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Resume' }),
      });
      const data = await res.json();
      if (data.success) router.push(`/builder/${data.resume_id}`);
    } finally {
      setCreating(false);
    }
  }

  async function deleteResume(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Delete this resume? This cannot be undone.')) return;
    const res = await fetch(`/api/resumes/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) setList((l) => l.filter((r) => r.id !== id));
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white text-sm">Q</div>
            <span className="font-extrabold tracking-tight hidden sm:inline">QuantumCV</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {isStaff && (
              <Link
                href="/admin"
                className="hidden sm:flex items-center gap-1.5 text-xs sm:text-sm font-semibold rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--bg-subtle)] transition-colors"
              >
                Admin
              </Link>
            )}
            <Link
              href="/billing"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold rounded-full border border-[var(--border)] px-3 py-1.5 hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <Coins size={14} className="text-[var(--accent)]" />
              {credits}
            </Link>
            <ThemeToggle />
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {userInitials}
            </div>
            <button onClick={logout} aria-label="Sign out" className="text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Welcome back, {userName.split(' ')[0]}</h1>
            <p className="text-[var(--fg-muted)] text-sm mt-1.5">Manage, tailor, and export ATS-ready resumes.</p>
          </div>
          <button
            onClick={createResume}
            disabled={creating}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-5 py-3 sm:py-2.5 hover:bg-[var(--accent-hover)] active:scale-[0.97] transition-all disabled:opacity-50 shrink-0 shadow-lg shadow-[var(--accent)]/20"
          >
            <Plus size={16} /> {creating ? 'Creating…' : 'New resume'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10">
          <StatCard label="Total resumes" value={stats.total} />
          <StatCard label="Generated" value={stats.generated} />
          <StatCard label="Exported" value={stats.exported} />
          <StatCard label="Avg ATS score" value={`${stats.avgAts}`} />
        </div>

        {list.length === 0 ? (
          <div className="text-center py-24 border-2 border-dashed border-[var(--border)] rounded-3xl bg-[var(--bg-subtle)]/40">
            <div className="w-14 h-14 rounded-2xl bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
              <FileText size={26} className="text-[var(--accent)]" strokeWidth={1.5} />
            </div>
            <p className="font-semibold mb-1">No resumes yet</p>
            <p className="text-sm text-[var(--fg-muted)] mb-5">Create your first AI-generated resume in under two minutes.</p>
            <button
              onClick={createResume}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus size={16} /> New resume
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {list.map((r) => (
              <div
                key={r.id}
                onClick={() => router.push(`/builder/${r.id}`)}
                className="group cursor-pointer rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden hover:border-[var(--accent)]/50 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Live preview thumbnail */}
                <div className="relative h-[168px] bg-[var(--bg-subtle)] overflow-hidden border-b border-[var(--border)]">
                  {r.previewData ? (
                    <div
                      className="absolute top-3 left-1/2 -translate-x-1/2 bg-white shadow-md pointer-events-none"
                      style={{ width: '210mm', transformOrigin: 'top center', transform: 'scale(0.19)' }}
                      dangerouslySetInnerHTML={{
                        __html: (TEMPLATES.find((t) => t.id === r.templateId) ?? TEMPLATES[0]).render(r.previewData, r.accent),
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText size={22} className="text-[var(--fg-muted)]" strokeWidth={1.5} />
                    </div>
                  )}
                  <span
                    className={`absolute top-2.5 right-2.5 text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm ${
                      r.status === 'exported'
                        ? 'bg-green-500/90 text-white'
                        : r.status === 'generated'
                        ? 'bg-[var(--accent)]/90 text-white'
                        : 'bg-black/60 text-white'
                    }`}
                  >
                    {r.status === 'exported' && <Download size={10} />}
                    {r.status === 'generated' && <Sparkles size={10} />}
                    {r.status}
                  </span>
                  <button
                    onClick={(e) => deleteResume(r.id, e)}
                    aria-label="Delete resume"
                    className="absolute top-2.5 left-2.5 w-7 h-7 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-sm truncate">{r.title}</h3>
                  <p className="text-xs text-[var(--fg-muted)] mt-0.5 truncate">
                    {r.targetRole || 'No target role'} · {r.country}
                  </p>

                  {r.atsScore > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] text-[var(--fg-muted)] mb-1">
                        <span>ATS Score</span>
                        <span>{r.atsScore}/100 · {r.atsLabel}</span>
                      </div>
                      <div className="h-1.5 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${r.atsScore}%` }} />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-1 mt-3.5 text-xs font-semibold text-[var(--accent)]">
                    Open resume <ArrowUpRight size={13} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <SupportWidget />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent)]/30 transition-colors">
      <div className="text-xl sm:text-2xl font-extrabold">{value}</div>
      <div className="text-xs text-[var(--fg-muted)] mt-1">{label}</div>
    </div>
  );
}
