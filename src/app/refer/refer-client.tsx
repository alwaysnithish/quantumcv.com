'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Gift, Copy, Check, MessageCircle, Users, Trophy, Lock, Sparkles } from 'lucide-react';
import AppWindow from '@/components/win/app-window';
import { LinkedInIcon } from '@/components/brand-icons';
import { REFERRAL_REWARD_CREDITS, REFERRAL_UNLOCK_COUNT, REFERRAL_MAX_REWARDED } from '@/lib/credit-config';

interface Stats {
  code: string;
  link: string;
  signedUp: number;
  rewarded: number;
  pending: number;
  creditsEarned: number;
  premiumUnlocked: boolean;
}

export default function ReferClient() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [state, setState] = useState<'loading' | 'guest' | 'ready' | 'error'>('loading');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('/api/referral')
      .then(async (r) => {
        if (r.status === 401) return setState('guest');
        const d = await r.json();
        if (!d.success) return setState('error');
        setStats(d);
        setState('ready');
      })
      .catch(() => setState('error'));
  }, []);

  const link = stats?.link ?? '';
  const waText = `Placement season tip 🎯 I used QuantumCV to check my resume's ATS score for free. Sign up with my link and we both get +${REFERRAL_REWARD_CREDITS} bonus credits once you finish your first ATS scan: ${link}`;
  const liText = `Free ATS resume checker for students & freshers — we both earn +${REFERRAL_REWARD_CREDITS} credits when you scan your first resume.`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  }

  const rewarded = stats?.rewarded ?? 0;
  const pct = Math.min(100, Math.round((rewarded / REFERRAL_UNLOCK_COUNT) * 100));

  return (
    <>
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Give {REFERRAL_REWARD_CREDITS}, Get {REFERRAL_REWARD_CREDITS}</h1>
      <p className="mt-4 max-w-2xl text-[var(--fg-muted)] leading-relaxed">
        Share your link. When a friend signs up (they still get their own 10 free credits) <b>and finishes their first free ATS scan</b>, you both receive +{REFERRAL_REWARD_CREDITS} bonus credits — automatically.
      </p>

      <div className="mt-8">
        <AppWindow title="Refer & Earn — QuantumCV" icon={<Gift size={14} className="text-[var(--accent)]" />}>
          <div className="space-y-6 p-5 sm:p-7">
            {state === 'loading' && <div className="h-40 animate-pulse rounded-xl bg-[var(--bg-subtle)]" />}

            {state === 'guest' && (
              <div className="py-6 text-center">
                <p className="font-semibold">Create a free account to get your personal referral link.</p>
                <Link href="/login" className="mt-4 inline-block rounded-full bg-[var(--accent)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]">Sign up — 10 free credits</Link>
              </div>
            )}

            {state === 'error' && <p className="py-6 text-center text-sm text-red-500">Couldn’t load your referral link. Refresh to try again.</p>}

            {state === 'ready' && stats && (
              <>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wide text-[var(--fg-muted)]">Your referral link</label>
                  <div className="mt-1.5 flex gap-2">
                    <input readOnly value={link} onFocus={(e) => e.currentTarget.select()} className="min-w-0 flex-1 rounded-lg border border-[var(--border)] px-3 py-2.5 font-mono text-sm" />
                    <button onClick={copy} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--accent)] px-4 text-sm font-bold text-white hover:bg-[var(--accent-hover)]">
                      {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy Link'}
                    </button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white hover:brightness-95">
                    <MessageCircle size={17} /> WhatsApp
                  </a>
                  <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-[#0A66C2] py-3 text-sm font-bold text-white hover:brightness-95">
                    <LinkedInIcon size={16} /> LinkedIn
                  </a>
                  <button onClick={copy} className="flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] py-3 text-sm font-bold hover:bg-[var(--bg-subtle)]">
                    <Copy size={16} /> Copy Link
                  </button>
                </div>
                <button
                  onClick={async () => { try { await navigator.clipboard.writeText(`${liText} ${link}`); } catch {} }}
                  className="text-xs font-semibold text-[var(--accent)] hover:underline"
                >
                  Copy a ready-made LinkedIn caption
                </button>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="flex items-center gap-2">{stats.premiumUnlocked ? <Sparkles size={16} className="text-amber-500" /> : <Lock size={16} className="text-[var(--fg-muted)]" />} Refer {REFERRAL_UNLOCK_COUNT} friends → unlock all premium templates</span>
                    <span>{Math.min(rewarded, REFERRAL_UNLOCK_COUNT)}/{REFERRAL_UNLOCK_COUNT}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-[var(--bg)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-violet-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  {stats.premiumUnlocked && <p className="mt-2 text-xs text-emerald-500">Premium templates are unlocked on your account.</p>}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { Icon: Users, label: 'Friends signed up', value: stats.signedUp },
                    { Icon: Check, label: 'Rewarded (scan done)', value: stats.rewarded },
                    { Icon: Trophy, label: 'Credits earned', value: `+${stats.creditsEarned}` },
                  ].map(({ Icon, label, value }) => (
                    <div key={label} className="rounded-xl border border-[var(--border)] p-4">
                      <Icon size={16} className="text-[var(--accent)]" />
                      <div className="mt-1 text-2xl font-extrabold">{value}</div>
                      <div className="text-xs text-[var(--fg-muted)]">{label}</div>
                    </div>
                  ))}
                </div>
                {stats.pending > 0 && <p className="text-xs text-[var(--fg-muted)]">{stats.pending} friend{stats.pending === 1 ? '' : 's'} signed up and still need to run their first ATS scan.</p>}
              </>
            )}
          </div>
        </AppWindow>
      </div>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ['1', 'Share your link', 'WhatsApp it to your placement group or post it on LinkedIn.'],
          ['2', 'Friend signs up & scans', 'They get their own 10 free credits, then run a free ATS scan.'],
          ['3', `You both get +${REFERRAL_REWARD_CREDITS}`, 'Credits land instantly and we email you both.'],
        ].map(([n, t, d]) => (
          <div key={n} className="glass p-5">
            <div className="text-xs font-extrabold text-[var(--accent)]">STEP {n}</div>
            <div className="mt-1 font-bold">{t}</div>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">{d}</p>
          </div>
        ))}
      </section>

      <section className="mt-10 text-xs leading-relaxed text-[var(--fg-muted)]">
        <h2 className="mb-2 text-sm font-bold text-[var(--fg)]">Fair-use rules</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>The reward is paid once per friend, only after their first completed ATS scan.</li>
          <li>Only brand-new accounts count; referring yourself or your own email aliases doesn’t qualify.</li>
          <li>Up to {REFERRAL_MAX_REWARDED} rewarded referrals per account.</li>
          <li>Bonus credits never expire. The premium-template unlock is permanent.</li>
        </ul>
      </section>
    </>
  );
}
