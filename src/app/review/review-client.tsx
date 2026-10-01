'use client';

import { ChangeEvent, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileUp,
  HelpCircle,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import type { ResumeReview } from '@/lib/resume-review';

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-2xl font-extrabold">
        {value}
        <span className="text-xs text-[var(--fg-muted)]">/100</span>
      </div>
      <p className="mt-1 text-xs text-[var(--fg-muted)]">{label}</p>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === 'critical') {
    return <span className="inline-flex items-center rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-500">Critical</span>;
  }
  if (p === 'high') {
    return <span className="inline-flex items-center rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">High Impact</span>;
  }
  if (p === 'medium') {
    return <span className="inline-flex items-center rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-500">Medium</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-slate-500/15 px-2 py-0.5 text-xs font-bold text-slate-400">Low</span>;
}

function ActionTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  if (type === 'immediate_fix') {
    return <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">⚡ Fix Immediately</span>;
  }
  if (type === 'missing_information') {
    return <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2 py-0.5 text-[11px] font-semibold text-purple-500">📋 Info Needed</span>;
  }
  if (type === 'role_dependent') {
    return <span className="inline-flex items-center rounded-full bg-sky-500/10 px-2 py-0.5 text-[11px] font-semibold text-sky-500">🎯 Role Dependent</span>;
  }
  return null;
}

function SectionActionBadge({ action }: { action: string }) {
  const a = action.toLowerCase();
  if (a === 'keep') return <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-500">Keep</span>;
  if (a === 'strengthen') return <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-blue-500">Strengthen</span>;
  if (a === 'shorten') return <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-500">Shorten</span>;
  if (a === 'reorder') return <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-purple-500">Reorder</span>;
  if (a === 'remove') return <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-red-500">Remove</span>;
  return <span className="rounded-md bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-400">{action}</span>;
}

export default function ReviewClient() {
  const [resumeText, setResumeText] = useState('');
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [review, setReview] = useState<ResumeReview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function reviewResume() {
    if (!resumeText.trim()) return setError('Paste your resume or upload a text file first.');
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/resume-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, role, job_description: jobDescription }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Review failed.');
      setReview(data.review);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Review failed.');
    } finally {
      setLoading(false);
    }
  }

  function uploadText(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/\.(txt|md)$/i.test(file.name)) {
      setError('For privacy and reliable parsing, upload a .txt or .md resume, or paste text from a PDF/DOCX.');
      return;
    }
    file.text().then(setResumeText).catch(() => setError('Could not read that file.'));
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main>
        <section className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--accent)_16%,transparent),transparent_52%)]">
          <div className="max-w-5xl mx-auto px-5 py-16 sm:py-24 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold text-[var(--fg-muted)]">
              <ScanSearch size={14} className="text-[var(--accent)]" /> Evidence-Based Resume Review
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-[-.06em]">
              Know what a recruiter sees.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[var(--fg-muted)]">
              Concrete weaknesses, terminology mistakes, STAR bullet rewrites, and ATS alignment derived strictly from your resume.
            </p>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-5 py-12 sm:py-16 grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="font-bold">Your resume</h2>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">Nothing is saved by this review.</p>
              </div>
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] px-3 py-2 text-xs font-bold hover:bg-[var(--bg-subtle)]">
                <FileUp size={14} /> Upload .txt
                <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={uploadText} className="hidden" />
              </label>
            </div>
            <textarea
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={18}
              placeholder="Paste your resume content here…"
              className="mt-5 w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm leading-6 outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <div className="space-y-5">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
              <h2 className="font-bold">Make the review specific</h2>
              <label className="mt-5 block text-xs font-bold text-[var(--fg-muted)]">Target role</label>
              <input
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="e.g. Product Designer or Backend Engineer"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <label className="mt-4 block text-xs font-bold text-[var(--fg-muted)]">
                Job description <span className="font-normal">(optional, enables keyword matching)</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                rows={6}
                placeholder="Paste a job description to check ATS keyword alignment…"
                className="mt-1.5 w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                onClick={reviewResume}
                disabled={loading}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white disabled:opacity-60 cursor-pointer"
              >
                {loading ? 'Reviewing…' : <><Sparkles size={15} />Review Resume</>}
              </button>
              {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
            </div>

            {!review && (
              <div className="rounded-3xl bg-slate-950 p-6 text-white">
                <p className="text-xs font-bold uppercase tracking-[.16em] text-sky-400">Strict Factual Review</p>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  QuantumCV evaluates what to clarify or prove. We never fabricate metrics, skills, or achievements.
                </p>
              </div>
            )}
          </div>
        </section>

        {review && (
          <section className="max-w-5xl mx-auto px-5 pb-20 space-y-8">
            {/* Header Score Banner */}
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 sm:p-8">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--accent)]">Review Result</p>
                    {review.career_stage && (
                      <span className="rounded-full bg-[var(--card)] border border-[var(--border)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--fg-muted)]">
                        {review.career_stage.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 text-3xl font-extrabold">{review.overall}/100 overall</h2>
                  {review.career_stage_context && (
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">{review.career_stage_context}</p>
                  )}
                </div>
                <Link href="/builder" className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)]">
                  Build a better version <ArrowRight size={15} />
                </Link>
              </div>

              <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Score label="ATS readiness" value={review.ats} />
                <Score label="Content" value={review.content} />
                <Score label="Impact" value={review.impact} />
                <Score label="Structure" value={review.structure} />
              </div>

              {/* Analysis Confidence Banner (Requirement 10) */}
              {review.analysis_confidence === 'low' && (
                <div className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300">
                  <strong className="font-bold">Analysis confidence: Low</strong> — PDF extraction or layout artifacts may have affected automated section detection. Your resume scores are protected from internal parser uncertainty.
                </div>
              )}

              {/* Detected Resume Structure layer */}
              {review.detected_structure && (
                <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-xs">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-[var(--fg)]">Detected Resume Structure</span>
                    <span className="text-[11px] text-[var(--fg-muted)]">
                      Confidence: <b className={review.analysis_confidence === 'low' ? 'text-amber-500' : 'text-emerald-500'}>{review.analysis_confidence?.toUpperCase() || 'HIGH'}</b>
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {Object.entries(review.detected_structure).map(([key, sec]) => {
                      const label = key === 'certifications_coursework' ? 'Certifications' : key === 'leadership' ? 'Leadership' : key.charAt(0).toUpperCase() + key.slice(1);
                      const state = sec.state || (sec.detected ? 'DETECTED' : 'NOT_DETECTED');
                      const isDetected = state === 'DETECTED';
                      const isUncertain = state === 'UNCERTAIN';
                      return (
                        <div
                          key={key}
                          className={`rounded-lg border px-2.5 py-1.5 flex items-center justify-between ${
                            isDetected
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : isUncertain
                              ? 'border-amber-500/30 bg-amber-500/5'
                              : 'border-[var(--border)] opacity-60'
                          }`}
                        >
                          <span className="truncate mr-1">{label}</span>
                          {isDetected ? (
                            <span className="text-emerald-600 font-bold">✓</span>
                          ) : isUncertain ? (
                            <span className="text-amber-600 font-bold text-[10px]">Uncertain</span>
                          ) : (
                            <span className="text-[var(--fg-muted)]">—</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION A: Top 5 Highest-Value Improvements */}
            {review.top_5_improvements && review.top_5_improvements.length > 0 && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
                <h3 className="font-extrabold text-base mb-4">A. Top Highest-Value Improvements</h3>
                <div className="space-y-3">
                  {review.top_5_improvements.map((item) => (
                    <div key={item.rank} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent)] text-white text-[11px] font-bold">
                            {item.rank}
                          </span>
                          <strong className="text-sm font-bold text-[var(--fg)]">{item.title}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={item.priority} />
                          <ActionTypeBadge type={item.action_type} />
                        </div>
                      </div>
                      <p className="text-[var(--fg-muted)]"><b>Observed:</b> {item.problem_found}</p>
                      <p className="mt-1 text-[var(--fg-muted)]"><b>Why it matters:</b> {item.why_it_matters}</p>
                      <p className="mt-2 font-medium text-emerald-700 dark:text-emerald-400"><b>Action:</b> {item.how_to_fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION B: Critical Issues */}
            {review.critical_issues && review.critical_issues.length > 0 && (
              <div className="rounded-3xl border border-red-500/30 bg-red-500/5 p-5 sm:p-7">
                <div className="flex items-center gap-2 text-red-500 mb-4">
                  <ShieldAlert size={18} />
                  <h3 className="font-extrabold text-base">B. Critical Issues to Fix ({review.critical_issues.length})</h3>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {review.critical_issues.map((crit, i) => (
                    <div key={i} className="rounded-xl border border-red-500/20 bg-[var(--bg)] p-4 text-xs">
                      <strong className="text-sm text-red-500 font-bold">{crit.title}</strong>
                      <p className="mt-1 text-[var(--fg-muted)]">{crit.problem_found}</p>
                      <p className="mt-1 text-[var(--fg-muted)]"><b>Why it matters:</b> {crit.why_it_matters}</p>
                      <p className="mt-2 font-medium text-emerald-600"><b>Fix:</b> {crit.how_to_fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION C: Content & Impact Improvements */}
            {review.content_impact_improvements && review.content_impact_improvements.length > 0 && (
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
                <h3 className="font-extrabold text-base mb-4">C. Content & Bullet Improvements</h3>
                <div className="space-y-4">
                  {review.content_impact_improvements.map((ci, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border)] p-4 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <strong className="text-sm font-bold text-[var(--fg)]">{ci.title}</strong>
                        <span className="text-[var(--fg-muted)]">{ci.location}</span>
                      </div>
                      <p className="text-[var(--fg-muted)]">{ci.issue_identified}</p>
                      <p className="text-[var(--fg-muted)]"><b>Why it matters:</b> {ci.why_it_matters}</p>
                      <p className="font-medium text-[var(--fg)]"><b>How to improve:</b> {ci.how_to_fix}</p>

                      {ci.before_after_examples && ci.before_after_examples.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {ci.before_after_examples.map((ex, exI) => (
                            <div key={exI} className="rounded-lg border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs">
                              <p className="text-red-500 font-bold text-[10px] uppercase">Original</p>
                              <p className="text-[var(--fg-muted)]">{ex.original}</p>
                              <p className="mt-2 text-emerald-600 font-bold text-[10px] uppercase">Active Rewrite</p>
                              <p className="font-medium text-[var(--fg)]">{ex.improved}</p>
                              {ex.metric_guidance && (
                                <p className="mt-1 text-amber-600 dark:text-amber-400 text-[11px]">
                                  💡 {ex.metric_guidance}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION E & F: Role Specific & Section Optimizations */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Role Alignment */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 text-xs">
                <h3 className="font-extrabold text-base mb-3">E. Role & Keyword Alignment</h3>
                {review.role_specific_improvements?.job_description_provided ? (
                  <div className="space-y-3">
                    {review.role_specific_improvements.strong_matches.length > 0 && (
                      <div>
                        <p className="font-bold text-emerald-600 uppercase text-[10px]">Matches Found</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {review.role_specific_improvements.strong_matches.map((kw) => (
                            <span key={kw} className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {review.role_specific_improvements.missing_important_keywords.length > 0 && (
                      <div>
                        <p className="font-bold text-amber-600 uppercase text-[10px]">Missing Keywords from JD</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {review.role_specific_improvements.missing_important_keywords.map((kw) => (
                            <span key={kw.keyword} className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                              {kw.keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-[var(--border)] p-4 text-center text-[var(--fg-muted)]">
                    <Target className="mx-auto mb-1 text-[var(--fg-muted)]" size={20} />
                    <p className="text-xs">{review.role_specific_improvements?.role_analysis_limited_note || 'No job description provided.'}</p>
                  </div>
                )}

                <h4 className="font-bold text-sm mt-5 mb-2">Strengths Observed</h4>
                <ul className="space-y-1.5">
                  {review.strengths.map((s, i) => (
                    <li key={i} className="flex gap-1.5 text-xs text-[var(--fg-muted)]">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section Optimization */}
              <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7 text-xs">
                <h3 className="font-extrabold text-base mb-3">F. Section Optimization</h3>
                {review.section_optimization && review.section_optimization.length > 0 ? (
                  <div className="space-y-3">
                    {review.section_optimization.map((sec, i) => (
                      <div key={i} className="rounded-xl border border-[var(--border)] p-3 space-y-1">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs font-bold text-[var(--fg)]">{sec.section_name}</strong>
                          <SectionActionBadge action={sec.action} />
                        </div>
                        <p className="text-[var(--fg-muted)]">{sec.reason}</p>
                        <p className="font-medium text-[var(--accent)]">{sec.recommendation}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[var(--fg-muted)]">All present sections are well-structured for your career stage.</p>
                )}

                {/* Candidate Info Needed */}
                {review.candidate_information_needed && review.candidate_information_needed.length > 0 && (
                  <div className="mt-5">
                    <h4 className="font-bold text-sm mb-2">G. Evidence to Provide</h4>
                    <div className="space-y-2">
                      {review.candidate_information_needed.map((info, i) => (
                        <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-2.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fg)]">
                            <HelpCircle size={13} className="text-[var(--accent)]" />
                            {info.item_to_provide}
                          </div>
                          <p className="text-[11px] text-[var(--fg-muted)] mt-1">{info.suggested_prompt}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
