'use client';

import { ChangeEvent, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FileUp,
  HelpCircle,
  Loader2,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';

type TopImprovement = {
  rank: number;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  title: string;
  problem_found: string;
  why_it_matters: string;
  action_type: 'immediate_fix' | 'missing_information' | 'role_dependent';
  how_to_fix: string;
  location: string;
};

type CriticalIssue = {
  type: string;
  title: string;
  problem_found: string;
  why_it_matters: string;
  how_to_fix: string;
  location: string;
};

type ContentImpactImprovement = {
  title: string;
  location: string;
  issue_identified: string;
  why_it_matters: string;
  how_to_fix: string;
  before_after_examples: Array<{
    original: string;
    improved: string;
    why_improved: string;
    metric_guidance?: string;
  }>;
};

type ATSImprovements = {
  parseability_status: string;
  ats_score_estimate?: number;
  recruiter_readability_balance: string;
  formatting_risks: string[];
  section_header_feedback: string[];
  keyword_strategy: string;
};

type RoleSpecificImprovements = {
  target_role: string;
  job_description_provided: boolean;
  role_analysis_limited_note?: string;
  strong_matches: string[];
  missing_important_keywords: Array<{ keyword: string; importance: string; reason: string }>;
  unproven_skills: Array<{ skill: string; note: string }>;
  experiences_to_emphasize: string[];
  unevidenced_claims_to_avoid: string[];
};

type SectionOptimization = {
  section_name: string;
  action: 'keep' | 'remove' | 'shorten' | 'reorder' | 'strengthen';
  reason: string;
  why_it_matters: string;
  recommendation: string;
};

type CandidateInformationNeeded = {
  item_to_provide: string;
  why_needed: string;
  suggested_prompt: string;
  target_section: string;
};

type DetectedSectionInfo = {
  state?: 'DETECTED' | 'NOT_DETECTED' | 'UNCERTAIN';
  detected: boolean;
  heading?: string;
  matched_heading?: string;
  confidence: 'high' | 'medium' | 'low' | 'none';
  confidence_score?: number;
  method?: 'EXACT_HEADING' | 'PATTERN_HEADING' | 'CONTENT_HEURISTIC' | 'LAYOUT_TABLE' | 'INLINE_PREFIX' | 'NONE';
  lineCount?: number;
  evidence?: string[];
};

type DetectedStructure = {
  education: DetectedSectionInfo;
  experience: DetectedSectionInfo;
  projects: DetectedSectionInfo;
  skills: DetectedSectionInfo;
  leadership: DetectedSectionInfo;
  achievements: DetectedSectionInfo;
  certifications_coursework: DetectedSectionInfo;
  summary: DetectedSectionInfo;
  publications: DetectedSectionInfo;
};

type Report = {
  overall_score: number;
  verdict: string;
  executive_summary: string;
  career_stage?: string;
  career_stage_context?: string;
  analysis_confidence?: 'high' | 'medium' | 'low';
  analysis_confidence_note?: string;
  detected_structure?: DetectedStructure;
  must_fix_count?: number;
  nice_to_have_count?: number;
  score_breakdown: { label: string; score: number | null; reason: string }[];
  top_5_improvements?: TopImprovement[];
  critical_issues?: CriticalIssue[];
  content_impact_improvements?: ContentImpactImprovement[];
  ats_improvements?: ATSImprovements;
  role_specific_improvements?: RoleSpecificImprovements;
  section_optimization?: SectionOptimization[];
  candidate_information_needed?: CandidateInformationNeeded[];
  recruiter_review?: {
    first_impression: string;
    strengths: string[];
    concerns: string[];
    interview_probability: string;
    likely_recruiter_questions: string[];
  };
  ats_review?: {
    parseability: string;
    matched_keywords: Array<string | { keyword?: string; context?: string }>;
    missing_keywords: Array<string | { keyword?: string; importance?: string; reason?: string }>;
    formatting_risks: string[];
    keyword_strategy: string;
  };
  section_reviews?: {
    section: string;
    score: number;
    what_works: string[];
    needs_work: string[];
    recommended_action: string;
  }[];
  priority_fixes?: { priority: string; title: string; why_it_matters: string; how_to_fix: string }[];
  rewrite_examples?: { original: string; improved: string; why: string; safe?: boolean }[];
  missing_information?: string[];
  next_steps?: string[];
  detailed_scoring?: { [key: string]: { score: number | null; issues: { name: string; status: string }[] } };
};

type SavedResume = { id: string; title: string; targetRole: string; updatedAt: string };

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let start = 0; start < bytes.length; start += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(start, start + 0x8000));
  }
  return btoa(binary);
}

function ScoreRing({ score }: { score: number }) {
  return (
    <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[10px] border-[var(--accent)] bg-[var(--bg)] shadow-xl shadow-[var(--accent)]/15">
      <div className="text-center">
        <div className="text-4xl font-extrabold tracking-tight">{score}</div>
        <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--fg-muted)]">Overall</div>
      </div>
    </div>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = priority.toLowerCase();
  if (p === 'critical') {
    return <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-0.5 text-xs font-bold text-red-500">Critical</span>;
  }
  if (p === 'high') {
    return <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/15 px-2 py-0.5 text-xs font-bold text-amber-500">High Impact</span>;
  }
  if (p === 'medium') {
    return <span className="inline-flex items-center gap-1 rounded-md bg-blue-500/15 px-2 py-0.5 text-xs font-bold text-blue-500">Medium</span>;
  }
  return <span className="inline-flex items-center gap-1 rounded-md bg-slate-500/15 px-2 py-0.5 text-xs font-bold text-slate-400">Low</span>;
}

function ActionTypeBadge({ type }: { type?: string }) {
  if (!type) return null;
  if (type === 'immediate_fix') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">⚡ Fix Immediately</span>;
  }
  if (type === 'missing_information') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-500">📋 Missing Info Needed</span>;
  }
  if (type === 'role_dependent') {
    return <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-sky-500">🎯 Role Dependent</span>;
  }
  return null;
}

function SectionActionBadge({ action }: { action: string }) {
  const a = action.toLowerCase();
  if (a === 'keep') return <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-emerald-500">Keep</span>;
  if (a === 'strengthen') return <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-blue-500">Strengthen</span>;
  if (a === 'shorten') return <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-amber-500">Shorten</span>;
  if (a === 'reorder') return <span className="rounded-md bg-purple-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-purple-500">Reorder</span>;
  if (a === 'remove') return <span className="rounded-md bg-red-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-red-500">Remove</span>;
  return <span className="rounded-md bg-slate-500/15 px-2 py-0.5 text-[11px] font-bold uppercase text-slate-400">{action}</span>;
}

export default function ResumeAnalyserClient({ resumes, initialResumeId }: { resumes: SavedResume[]; initialResumeId: string }) {
  const [resumeId, setResumeId] = useState(initialResumeId);
  const [resumeText, setResumeText] = useState('');
  const [document, setDocument] = useState<{ base64: string; mimeType: string; name: string } | null>(null);
  const [role, setRole] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return setError('Keep uploads below 6 MB.');
    setError('');
    setResumeId('');
    setResumeText('');
    setDocument({ base64: toBase64(await file.arrayBuffer()), mimeType: file.type || 'application/pdf', name: file.name });
  }

  async function analyse() {
    if (!resumeId && !resumeText.trim() && !document) return setError('Choose a saved resume, upload one, or paste its text.');
    setLoading(true);
    setError('');
    setReport(null);
    try {
      const response = await fetch('/api/resumeanalyser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_id: resumeId || undefined,
          resume_text: resumeText || undefined,
          document: document || undefined,
          role,
          job_description: jobDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Analysis failed.');
      setReport(data.report);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  const sourceLabel = resumeId ? 'Saved QuantumCV resume' : document ? document.name : resumeText ? 'Pasted resume' : 'No resume selected';

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main>
        {/* Header Section */}
        <section className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--accent)_20%,transparent),transparent_50%)]">
          <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-[var(--fg-muted)]">
                <ScanSearch size={14} className="text-[var(--accent)]" /> Evidence-Based Analysis Engine
              </div>
              <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-[-.06em] leading-[.95]">
                Your resume,<br />reviewed like a recruiter.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--fg-muted)]">
                Prioritized, factual, and actionable recommendations derived strictly from your resume—no generic advice, no hallucinated metrics.
              </p>
            </div>
          </div>
        </section>

        {/* Input Controls */}
        <section className="max-w-6xl mx-auto px-5 py-10 sm:py-14 grid gap-7 lg:grid-cols-[1.05fr_.95fr]">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold">Choose what to analyse</h2>
                <p className="mt-1 text-xs text-[var(--fg-muted)]">Your file is used for this request only and is not saved.</p>
              </div>
              <FileSearch className="text-[var(--accent)]" />
            </div>
            <label className="mt-6 block text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)]">Saved QuantumCV resume</label>
            <select
              value={resumeId}
              onChange={(event) => {
                setResumeId(event.target.value);
                setDocument(null);
                setResumeText('');
              }}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm"
            >
              <option value="">Choose from dashboard…</option>
              {resumes.map((resume) => (
                <option key={resume.id} value={resume.id}>
                  {resume.title} {resume.targetRole ? `— ${resume.targetRole}` : ''}
                </option>
              ))}
            </select>
            <div className="my-5 flex items-center gap-3 text-xs text-[var(--fg-muted)] before:h-px before:flex-1 before:bg-[var(--border)] after:h-px after:flex-1 after:bg-[var(--border)]">
              OR
            </div>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--border)] p-5 text-sm font-bold hover:border-[var(--accent)] hover:bg-[var(--accent)]/5">
              <FileUp size={18} className="text-[var(--accent)]" />
              {document ? document.name : 'Upload PDF, DOCX, or text'}
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={pickFile}
                className="hidden"
              />
            </label>
            <textarea
              value={resumeText}
              onChange={(event) => {
                setResumeText(event.target.value);
                setResumeId('');
                setDocument(null);
              }}
              rows={6}
              placeholder="Or paste resume text here…"
              className="mt-4 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <p className="mt-3 text-xs text-[var(--fg-muted)]">
              Selected: <span className="font-semibold text-[var(--fg)]">{sourceLabel}</span>
            </p>
          </div>

          <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
            <div className="flex items-center gap-2">
              <Target size={18} className="text-[var(--accent)]" />
              <h2 className="text-lg font-extrabold">Set the hiring context</h2>
            </div>
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)]">Target role</label>
            <input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="mt-2 w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <label className="mt-5 block text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)]">
              Job description <span className="font-normal normal-case">optional, enables deep role & keyword matching</span>
            </label>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={8}
              placeholder="Paste the role requirements to surface matched skills, missing keywords, and unproven claims…"
              className="mt-2 w-full rounded-xl border border-[var(--border)] p-3 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            <button
              onClick={analyse}
              disabled={loading}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing resume content…
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Run Full Resume Analysis
                </>
              )}
            </button>
            {error && <p className="mt-3 text-xs text-red-500">{error}</p>}
          </div>
        </section>

        {loading && (
          <section className="max-w-6xl mx-auto px-5 pb-16">
            <div className="rounded-3xl bg-slate-950 p-10 text-center text-white">
              <Loader2 className="mx-auto animate-spin text-sky-400" size={32} />
              <h2 className="mt-4 text-xl font-bold">Running rigorous resume audit</h2>
              <p className="mt-2 text-sm text-slate-400">
                Evaluating terminology, evidence density, STAR bullets, ATS parseability, and role alignment.
              </p>
            </div>
          </section>
        )}

        {report && (
          <section className="max-w-6xl mx-auto px-5 pb-20 space-y-8">
            {/* Top Verdict Banner */}
            <div className="rounded-3xl bg-slate-950 p-6 text-white sm:flex sm:items-center sm:justify-between sm:p-9 shadow-xl">
              <div className="max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-[.15em] text-sky-400">Analysis Complete</span>
                  {report.career_stage && (
                    <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-300">
                      Stage: {report.career_stage.replace('_', ' ')}
                    </span>
                  )}
                  {report.must_fix_count !== undefined && report.must_fix_count > 0 && (
                    <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-red-400">
                      {report.must_fix_count} must-fix blocker{report.must_fix_count === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
                <h2 className="mt-3 text-2xl sm:text-3xl font-extrabold">{report.verdict}</h2>
                <p className="mt-4 leading-7 text-slate-300">{report.executive_summary}</p>
                {report.career_stage_context &&
                  report.career_stage_context.trim() !== report.executive_summary.trim() &&
                  !report.executive_summary.includes(report.career_stage_context) && (
                    <p className="mt-2 text-xs text-slate-400 italic">{report.career_stage_context}</p>
                  )}
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-8">
                <ScoreRing score={report.overall_score} />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="grid gap-3 sm:grid-cols-5">
              {report.score_breakdown.map((item) => (
                <div key={item.label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4">
                  <div className="text-2xl font-extrabold">{item.score !== null ? item.score : '—'}</div>
                  <p className="mt-1 text-xs font-bold">{item.label}</p>
                  <p className="mt-2 text-[11px] leading-4 text-[var(--fg-muted)]">{item.reason}</p>
                </div>
              ))}
            </div>

            {/* Analysis Confidence Banner */}
            {report.analysis_confidence === 'low' && (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={16} />
                <div>
                  <strong className="font-bold">Analysis confidence: Low</strong> — PDF extraction or layout artifacts may have affected automated section detection. Your resume scores are protected from internal parser uncertainty.
                </div>
              </div>
            )}

            {/* Detected Resume Structure layer */}
            {report.detected_structure && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ScanSearch size={16} className="text-[var(--accent)]" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--fg)]">Detected Resume Structure</h3>
                  </div>
                  <span className="text-[11px] text-[var(--fg-muted)]">
                    Confidence: <b className={report.analysis_confidence === 'low' ? 'text-amber-500' : 'text-emerald-500'}>{report.analysis_confidence?.toUpperCase() || 'HIGH'}</b>
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs">
                  {Object.entries(report.detected_structure).map(([key, sec]) => {
                    const label =
                      key === 'certifications_coursework'
                        ? 'Certifications'
                        : key === 'leadership'
                        ? 'Leadership'
                        : key.charAt(0).toUpperCase() + key.slice(1);
                    const state = sec.state || (sec.detected ? 'DETECTED' : 'NOT_DETECTED');
                    const isDetected = state === 'DETECTED';
                    const isUncertain = state === 'UNCERTAIN';

                    return (
                      <div
                        key={key}
                        className={`rounded-xl border p-2.5 flex flex-col justify-between gap-1.5 ${
                          isDetected
                            ? 'border-emerald-500/30 bg-emerald-500/5 text-[var(--fg)]'
                            : isUncertain
                            ? 'border-amber-500/30 bg-amber-500/5 text-[var(--fg)]'
                            : 'border-[var(--border)] bg-[var(--bg-subtle)] text-[var(--fg-muted)] opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-semibold truncate">{label}</span>
                          {isDetected ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-md shrink-0">
                              Detected
                            </span>
                          ) : isUncertain ? (
                            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md shrink-0">
                              Uncertain
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                              Not detected
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[var(--fg-muted)]">
                          <span className="capitalize">{sec.confidence} conf.</span>
                          {sec.matched_heading && sec.matched_heading !== 'none' && (
                            <span className="truncate max-w-[80px] italic">{sec.matched_heading}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION A: Top 5 Highest-Value Improvements */}
            {report.top_5_improvements && report.top_5_improvements.length > 0 && (
              <ReportCard title="A. Top Highest-Value Improvements" badge={`${report.top_5_improvements.length} prioritized items`}>
                <p className="text-xs text-[var(--fg-muted)] mb-5">
                  Ranked by actual hiring impact. Address critical issues and high-priority bullet evidence first.
                </p>
                <div className="space-y-4">
                  {report.top_5_improvements.map((item) => (
                    <div key={item.rank} className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 transition hover:border-[var(--accent)]/50">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-white">
                            {item.rank}
                          </span>
                          <h3 className="font-bold text-sm sm:text-base">{item.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <PriorityBadge priority={item.priority} />
                          <ActionTypeBadge type={item.action_type} />
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 text-xs leading-5">
                        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3">
                          <p className="font-bold text-red-500 uppercase tracking-wider text-[10px]">Problem Observed ({item.location})</p>
                          <p className="mt-1 text-[var(--fg-muted)]">{item.problem_found}</p>
                          <p className="mt-2 font-bold text-[var(--fg)] text-[11px]">Why it matters:</p>
                          <p className="text-[var(--fg-muted)]">{item.why_it_matters}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3">
                          <p className="font-bold text-emerald-600 uppercase tracking-wider text-[10px]">Action to Take</p>
                          <p className="mt-1 font-medium text-[var(--fg)]">{item.how_to_fix}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            {/* SECTION B: Critical Issues to Fix */}
            {report.critical_issues && report.critical_issues.length > 0 && (
              <ReportCard title="B. Critical Issues to Fix" badge={`${report.critical_issues.length} must fix`}>
                <p className="text-xs text-[var(--fg-muted)] mb-4">
                  Factual errors, technical terminology mistakes, date conflicts, and major ATS parse risks that should be resolved immediately.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {report.critical_issues.map((issue, idx) => (
                    <div key={idx} className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
                      <div className="flex items-center gap-2 text-red-500 text-xs font-bold uppercase tracking-wider">
                        <ShieldAlert size={15} />
                        <span>{issue.type.replace(/_/g, ' ')}</span>
                      </div>
                      <h4 className="mt-1 font-bold text-sm">{issue.title}</h4>
                      <p className="mt-2 text-xs text-[var(--fg-muted)]"><b>Found:</b> {issue.problem_found}</p>
                      <p className="mt-1 text-xs text-[var(--fg-muted)]"><b>Impact:</b> {issue.why_it_matters}</p>
                      <p className="mt-2.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <b>Fix:</b> {issue.how_to_fix}
                      </p>
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            {/* SECTION C: Content & Impact Improvements (with Before/After Rewrites) */}
            {report.content_impact_improvements && report.content_impact_improvements.length > 0 && (
              <ReportCard title="C. Content & Bullet Impact Improvements">
                <p className="text-xs text-[var(--fg-muted)] mb-5">
                  Converts passive responsibilities into active STAR-framed bullets without fabricating false numbers.
                </p>
                <div className="space-y-6">
                  {report.content_impact_improvements.map((ci, index) => (
                    <div key={index} className="rounded-2xl border border-[var(--border)] p-4 sm:p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <h3 className="font-bold text-sm">{ci.title}</h3>
                        <span className="text-xs text-[var(--fg-muted)]">{ci.location}</span>
                      </div>
                      <p className="text-xs text-[var(--fg-muted)]">{ci.issue_identified}</p>
                      <p className="mt-1 text-xs text-[var(--fg-muted)]"><b>Why it matters:</b> {ci.why_it_matters}</p>
                      <p className="mt-2 text-xs font-medium text-[var(--fg)]"><b>How to improve:</b> {ci.how_to_fix}</p>

                      {ci.before_after_examples && ci.before_after_examples.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {ci.before_after_examples.map((ex, exIdx) => (
                            <div key={exIdx} className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5 sm:grid-cols-2">
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-red-500">Current Resume Text</p>
                                <p className="mt-1 text-xs text-[var(--fg-muted)]">{ex.original}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Action-Driven Suggested Rewrite</p>
                                <p className="mt-1 text-xs font-medium text-[var(--fg)]">{ex.improved}</p>
                                <p className="mt-1.5 text-[11px] text-[var(--fg-muted)] italic">{ex.why_improved}</p>
                                {ex.metric_guidance && (
                                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                    💡 {ex.metric_guidance}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            {/* Fallback Rewrite Examples if present */}
            {(!report.content_impact_improvements || report.content_impact_improvements.length === 0) &&
              report.rewrite_examples &&
              report.rewrite_examples.length > 0 && (
                <ReportCard title="Safe Rewrite Examples">
                  <div className="space-y-4">
                    {report.rewrite_examples.map((example, index) => (
                      <div key={index} className="grid gap-3 rounded-xl border border-[var(--border)] p-4 md:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold text-red-500">CURRENT</p>
                          <p className="mt-1 text-sm text-[var(--fg-muted)]">{example.original}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600">SUGGESTED</p>
                          <p className="mt-1 text-sm">{example.improved}</p>
                          <p className="mt-2 text-xs text-[var(--fg-muted)]">{example.why}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ReportCard>
              )}

            {/* SECTION D: ATS Improvements */}
            {report.ats_improvements && (
              <ReportCard title="D. ATS Improvements & Recruiter Scannability">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-subtle)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase text-[var(--fg-muted)]">Parseability Status</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${report.ats_improvements.parseability_status === 'Good' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}`}>
                        {report.ats_improvements.parseability_status}
                      </span>
                    </div>
                    <p className="text-xs leading-5 text-[var(--fg-muted)]">
                      {report.ats_improvements.recruiter_readability_balance}
                    </p>
                    {report.ats_improvements.formatting_risks.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-amber-600">Formatting / Parsing Risks:</p>
                        <ul className="mt-1 space-y-1">
                          {report.ats_improvements.formatting_risks.map((risk, i) => (
                            <li key={i} className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
                              <AlertCircle size={13} className="text-amber-500 shrink-0" />
                              {risk}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--bg-subtle)]">
                    <span className="text-xs font-bold uppercase text-[var(--fg-muted)]">Non-Stuffed Keyword Strategy</span>
                    <p className="mt-2 text-xs leading-5 text-[var(--fg-muted)]">
                      {report.ats_improvements.keyword_strategy}
                    </p>
                    {report.ats_improvements.section_header_feedback?.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-bold text-[var(--fg)]">Section Headers:</p>
                        <p className="text-xs text-[var(--fg-muted)]">{report.ats_improvements.section_header_feedback.join(' ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </ReportCard>
            )}

            {/* SECTION E: Role-Specific Improvements */}
            {report.role_specific_improvements && (
              <ReportCard title="E. Role-Specific Match & Keyword Analysis">
                {report.role_specific_improvements.job_description_provided ? (
                  <div className="space-y-5">
                    <div className="flex flex-wrap gap-2 text-xs text-[var(--fg-muted)]">
                      <span>Target Role: <strong className="text-[var(--fg)]">{report.role_specific_improvements.target_role || 'General'}</strong></span>
                    </div>

                    {report.role_specific_improvements.strong_matches.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Strong Matches Found</h4>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {report.role_specific_improvements.strong_matches.map((kw, i) => (
                            <span key={i} className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.role_specific_improvements.missing_important_keywords.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wide">Missing Important Keywords</h4>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {report.role_specific_improvements.missing_important_keywords.map((item, i) => (
                            <div key={i} className="rounded-xl border border-[var(--border)] p-3 text-xs">
                              <div className="flex items-center justify-between">
                                <strong className="text-[var(--accent)]">{item.keyword}</strong>
                                <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-600">{item.importance} Priority</span>
                              </div>
                              <p className="mt-1 text-[var(--fg-muted)] text-[11px]">{item.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.role_specific_improvements.unproven_skills.length > 0 && (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
                        <h4 className="font-bold text-amber-700 dark:text-amber-400">Skills Listed Without Evidence</h4>
                        <p className="mt-1 text-[var(--fg-muted)]">
                          These skills appear in your skills list but lack supporting bullet evidence in your experience or projects:
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {report.role_specific_improvements.unproven_skills.map((s, i) => (
                            <span key={i} className="rounded-md border border-amber-500/30 bg-[var(--bg)] px-2 py-1 text-xs font-medium">
                              {s.skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.role_specific_improvements.unevidenced_claims_to_avoid.length > 0 && (
                      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3 text-xs text-[var(--fg-muted)]">
                        <strong className="text-[var(--fg)]">Recruiter Caution:</strong> {report.role_specific_improvements.unevidenced_claims_to_avoid.join(' ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] p-6 text-center">
                    <Target className="mx-auto text-[var(--fg-muted)] mb-2" size={24} />
                    <h3 className="font-bold text-sm">Role-Specific Analysis is Limited</h3>
                    <p className="mt-1 text-xs text-[var(--fg-muted)] max-w-lg mx-auto">
                      {report.role_specific_improvements.role_analysis_limited_note ||
                        'No target role or job description was provided. Provide a target job description above to get precise keyword matching and role fit scoring.'}
                    </p>
                  </div>
                )}
              </ReportCard>
            )}

            {/* SECTION F: Section Optimization */}
            {report.section_optimization && report.section_optimization.length > 0 && (
              <ReportCard title="F. Section Optimization (Remove, Shorten, Reorder, Strengthen)">
                <p className="text-xs text-[var(--fg-muted)] mb-4">
                  Evaluates whether each section genuinely improves the resume or adds clutter.
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {report.section_optimization.map((sec, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-sm text-[var(--fg)]">{sec.section_name}</h4>
                        <SectionActionBadge action={sec.action} />
                      </div>
                      <p className="text-[var(--fg-muted)]"><b>Reason:</b> {sec.reason}</p>
                      <p className="mt-1 text-[var(--fg-muted)]"><b>Impact:</b> {sec.why_it_matters}</p>
                      <p className="mt-2 font-medium text-[var(--accent)]"><b>Action:</b> {sec.recommendation}</p>
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            {/* SECTION G: Information Candidate Should Provide */}
            {report.candidate_information_needed && report.candidate_information_needed.length > 0 && (
              <ReportCard title="G. Evidence & Information You Should Provide">
                <p className="text-xs text-[var(--fg-muted)] mb-4">
                  Specific factual metrics, scale details, or project scopes needed to make your bullets undeniable to hiring teams.
                </p>
                <div className="space-y-3">
                  {report.candidate_information_needed.map((info, i) => (
                    <div key={i} className="flex gap-3 rounded-xl border border-[var(--border)] p-3.5 text-xs">
                      <HelpCircle className="text-[var(--accent)] shrink-0 mt-0.5" size={16} />
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center justify-between">
                          <strong className="text-[var(--fg)]">{info.item_to_provide}</strong>
                          <span className="text-[11px] text-[var(--fg-muted)]">{info.target_section}</span>
                        </div>
                        <p className="text-[var(--fg-muted)]">{info.why_needed}</p>
                        <p className="mt-1 rounded-md bg-[var(--bg-subtle)] p-2 font-medium text-[var(--fg)]">
                          💬 <em>{info.suggested_prompt}</em>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ReportCard>
            )}

            {/* Recruiter Review Summary Card */}
            {report.recruiter_review && (
              <div className="grid gap-6 lg:grid-cols-2">
                <ReportCard title="Recruiter 6-Second Glance">
                  <p className="text-sm leading-6 text-[var(--fg-muted)]">{report.recruiter_review.first_impression}</p>
                  <h3 className="mt-5 text-xs font-bold uppercase text-emerald-600 tracking-wide">Candidate Strengths</h3>
                  <List items={report.recruiter_review.strengths} />
                  <h3 className="mt-5 text-xs font-bold uppercase text-amber-600 tracking-wide">Potential Recruiter Pauses</h3>
                  <List items={report.recruiter_review.concerns} />
                  <p className="mt-5 rounded-xl bg-[var(--bg-subtle)] p-3 text-xs">
                    <b>Interview probability:</b> <span className="font-bold text-[var(--accent)]">{report.recruiter_review.interview_probability}</span>
                  </p>
                </ReportCard>

                {report.recruiter_review.likely_recruiter_questions && report.recruiter_review.likely_recruiter_questions.length > 0 ? (
                  <ReportCard title="Likely Recruiter Screening Questions">
                    <p className="text-xs text-[var(--fg-muted)] mb-3">
                      Be prepared to answer these specific questions during recruiter phone screens:
                    </p>
                    <ul className="space-y-2.5">
                      {report.recruiter_review.likely_recruiter_questions.map((q, i) => (
                        <li key={i} className="flex gap-2 text-xs leading-5 text-[var(--fg-muted)] rounded-xl border border-[var(--border)] p-3 bg-[var(--bg-subtle)]">
                          <span className="font-bold text-[var(--accent)]">Q{i + 1}:</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </ReportCard>
                ) : (
                  <ReportCard title="Suggested Next Steps">
                    <List items={report.next_steps || ['Apply the top 5 high-value fixes in QuantumCV Builder.', 'Verify that all technical term casing is standardized.']} />
                  </ReportCard>
                )}
              </div>
            )}

            {/* CTA */}
            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              <Link
                href="/builder"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[var(--accent-hover)] transition"
              >
                Apply Fixes in QuantumCV Builder <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-[var(--fg-muted)]">Your edits and AI improvements are tracked and versioned automatically.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ReportCard({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-5 sm:p-7">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {badge && <span className="rounded-full bg-[var(--accent)]/10 px-2.5 py-0.5 text-xs font-bold text-[var(--accent)]">{badge}</span>}
      </div>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  const cleanItems = (items || []).filter((item) => item && item.trim() && item.trim() !== '-');
  if (cleanItems.length === 0) {
    return (
      <p className="mt-2 text-xs text-[var(--fg-muted)] italic">No major recruiter-facing issues identified.</p>
    );
  }
  return (
    <ul className="mt-2 space-y-2">
      {cleanItems.map((item, index) => (
        <li key={`${item}-${index}`} className="flex gap-2 text-xs leading-5 text-[var(--fg-muted)]">
          <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--accent)]" />
          {item}
        </li>
      ))}
    </ul>
  );
}
