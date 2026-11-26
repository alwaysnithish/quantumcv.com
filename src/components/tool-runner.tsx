'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, Copy, Check, ArrowRight, Wand2 } from 'lucide-react';
import AppWindow from '@/components/win/app-window';
import type { ToolConfig } from '@/lib/tools-config';

type Result = Record<string, any>;

function CopyBtn({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {}
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-semibold hover:bg-[var(--bg-subtle)]"
    >
      {done ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
      {done ? 'Copied' : label}
    </button>
  );
}

function Chips({ items, tone }: { items?: string[]; tone: 'red' | 'blue' | 'green' | 'slate' }) {
  const colors = {
    red: 'bg-red-500/12 text-red-500',
    blue: 'bg-sky-500/12 text-sky-500',
    green: 'bg-emerald-500/12 text-emerald-600',
    slate: 'bg-slate-500/12 text-[var(--fg-muted)]',
  } as const;
  if (!items?.length) return <p className="text-xs text-[var(--fg-muted)]">None found.</p>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((k) => (
        <span key={k} className={`rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{k}</span>
      ))}
    </div>
  );
}

/** Text that is saved into the builder's "Career data" box. */
function buildSeed(slug: string, result: Result, values: Record<string, string>): { text: string; role?: string } {
  switch (slug) {
    case 'resume-bullet-point-generator':
      return {
        role: values.role,
        text: `${values.role}\n${(result.bullets ?? []).map((b: any) => `- ${b.improved}`).join('\n')}`,
      };
    case 'ats-keyword-generator':
      return { role: values.role, text: `Skills / keywords to include: ${[...(result.must_have ?? []), ...(result.hard_skills ?? [])].filter((v, i, a) => a.indexOf(v) === i).join(', ')}` };
    case 'resume-summary-generator':
      return { role: values.role, text: `Summary: ${result.summaries?.[0]?.text ?? ''}` };
    default:
      return { role: values.role, text: '' };
  }
}

export default function ToolRunner({ tool }: { tool: ToolConfig }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(tool.fields.map((f) => [f.name, f.type === 'select' ? f.options?.[0] ?? '' : '']))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`/api/tools/${tool.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Something went wrong.');
      setResult(data.result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function saveToResume() {
    if (result) {
      const seed = buildSeed(tool.slug, result, values);
      try {
        sessionStorage.setItem('qcv_tool_seed', JSON.stringify({ ...seed, source: tool.slug }));
      } catch {}
    }
    router.push('/builder');
  }

  const field = 'mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[var(--accent)]';

  return (
    <AppWindow title={`${tool.navTitle} — QuantumCV`} icon={<Wand2 size={14} className="text-[var(--accent)]" />}>
      <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            run();
          }}
          className="space-y-4"
        >
          {tool.fields.map((f) => (
            <div key={f.name}>
              <label htmlFor={f.name} className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)]">
                {f.label}
              </label>
              {f.type === 'textarea' ? (
                <textarea id={f.name} rows={f.rows ?? 5} maxLength={f.maxLength} required={f.required} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className={field} />
              ) : f.type === 'select' ? (
                <select id={f.name} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className={field}>
                  {f.options?.map((o) => <option key={o}>{o}</option>)}
                </select>
              ) : (
                <input id={f.name} type="text" maxLength={f.maxLength} required={f.required} placeholder={f.placeholder} value={values[f.name]} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} className={field} />
              )}
            </div>
          ))}
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] py-3 text-sm font-bold text-white hover:bg-[var(--accent-hover)] disabled:opacity-60">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Working…' : tool.cta}
          </button>
          <p className="text-center text-[11px] text-[var(--fg-muted)]">Free preview · 0 credits · no signup needed</p>
          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-xs text-red-500">{error}</p>}
        </form>

        <div className="min-h-[220px]" aria-live="polite">
          {!result && !loading && (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--fg-muted)]">
              Your result appears here.
            </div>
          )}
          {loading && (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-xl border border-[var(--border)] p-6 text-sm text-[var(--fg-muted)]">
              <Loader2 size={18} className="mr-2 animate-spin text-[var(--accent)]" /> Writing…
            </div>
          )}

          {result && tool.slug === 'resume-bullet-point-generator' && (
            <div className="space-y-3">
              {(result.bullets ?? []).map((b: any, i: number) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                  <p className="text-[11px] text-[var(--fg-muted)] line-through">{b.original}</p>
                  <p className="mt-1 text-sm font-medium">• {b.improved}</p>
                  {b.metric_tip && <p className="mt-1.5 text-[11px] text-amber-600">💡 {b.metric_tip}</p>}
                  <div className="mt-2"><CopyBtn text={b.improved} /></div>
                </div>
              ))}
              <CopyBtn label="Copy all bullets" text={(result.bullets ?? []).map((b: any) => `• ${b.improved}`).join('\n')} />
            </div>
          )}

          {result && tool.slug === 'ats-keyword-generator' && (
            <div className="space-y-4">
              <div><h3 className="mb-1.5 text-xs font-bold uppercase text-[var(--fg-muted)]">Must-have</h3><Chips items={result.must_have} tone="red" /></div>
              <div><h3 className="mb-1.5 text-xs font-bold uppercase text-[var(--fg-muted)]">Hard skills</h3><Chips items={result.hard_skills} tone="blue" /></div>
              <div><h3 className="mb-1.5 text-xs font-bold uppercase text-[var(--fg-muted)]">Tools & tech</h3><Chips items={result.tools_and_tech} tone="blue" /></div>
              <div><h3 className="mb-1.5 text-xs font-bold uppercase text-[var(--fg-muted)]">Soft skills</h3><Chips items={result.soft_skills} tone="green" /></div>
              <div><h3 className="mb-1.5 text-xs font-bold uppercase text-[var(--fg-muted)]">Nice-to-have</h3><Chips items={result.nice_to_have} tone="slate" /></div>
              {result.resume_tip && <p className="rounded-lg bg-sky-500/10 p-3 text-xs">💡 {result.resume_tip}</p>}
              <CopyBtn label="Copy all keywords" text={[...(result.must_have ?? []), ...(result.hard_skills ?? []), ...(result.tools_and_tech ?? []), ...(result.soft_skills ?? [])].join(', ')} />
            </div>
          )}

          {result && tool.slug === 'resume-summary-generator' && (
            <div className="space-y-3">
              {(result.summaries ?? []).map((s: any, i: number) => (
                <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                  <p className="text-[11px] font-bold uppercase text-[var(--accent)]">{s.style}</p>
                  <p className="mt-1 text-sm leading-relaxed">{s.text}</p>
                  <div className="mt-2"><CopyBtn text={s.text} /></div>
                </div>
              ))}
              {result.objective && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-3.5">
                  <p className="text-[11px] font-bold uppercase text-[var(--accent)]">Career objective</p>
                  <p className="mt-1 text-sm leading-relaxed">{result.objective}</p>
                  <div className="mt-2"><CopyBtn text={result.objective} /></div>
                </div>
              )}
            </div>
          )}

          {result && tool.slug === 'cover-letter-generator' && (
            <div className="space-y-3">
              <pre className="whitespace-pre-wrap rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4 font-sans text-sm leading-relaxed">{result.letter}</pre>
              <CopyBtn label="Copy letter" text={result.letter ?? ''} />
            </div>
          )}

          {result && (
            <button onClick={saveToResume} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[var(--accent)] py-2.5 text-sm font-bold text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white">
              Save to Full Resume (Uses 0 Credits for Preview) <ArrowRight size={15} />
            </button>
          )}
        </div>
      </div>
    </AppWindow>
  );
}
