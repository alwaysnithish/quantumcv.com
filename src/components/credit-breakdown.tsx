'use client';

import { useMemo, useState } from 'react';
import { Check, X, Gift, FileText, Pencil, ScanSearch, Infinity as InfinityIcon, Calculator } from 'lucide-react';
import { useCurrency, formatPrice, type Currency } from '@/lib/currency';
import { PLANS } from '@/lib/plans';
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS } from '@/lib/credit-config';

const RESUMES_FROM_BONUS = Math.floor(SIGNUP_BONUS_CREDITS / CREDIT_COSTS.generate);

function money(currency: Currency, n: number) {
  const d = currency === 'INR' ? (n < 10 ? 2 : 0) : 2;
  return `${currency === 'INR' ? '₹' : '$'}${n.toFixed(d)}`;
}

/** Compact one-line explainer used on the homepage, login and billing pages. */
export function CreditStrip({ className = '' }: { className?: string }) {
  return (
    <div className={`glass px-4 py-3 text-center text-sm ${className}`}>
      <b>{SIGNUP_BONUS_CREDITS} free credits at signup</b> = <b>{RESUMES_FROM_BONUS} full AI resumes</b> ({CREDIT_COSTS.generate} credits each){' '}
      <span className="text-[var(--fg-muted)]">or</span> <b>{SIGNUP_BONUS_CREDITS} AI edits</b> ({CREDIT_COSTS.chat_edit} credit each).{' '}
      <span className="text-[var(--fg-muted)]">ATS checks & manual edits: free, unlimited.</span>
    </div>
  );
}

/** "Exactly what credits buy" — the zero-confusion breakdown. */
export function CreditBreakdown() {
  const rows = [
    { Icon: FileText, label: 'Full AI resume', cost: `${CREDIT_COSTS.generate} credits`, sub: 'Generated, structured and ATS-optimised' },
    { Icon: Pencil, label: 'AI chat edit or bullet enhance', cost: `${CREDIT_COSTS.chat_edit} credit`, sub: 'Each AI rewrite request' },
  ];
  const free = ['ATS score checks — unlimited', 'Manual editing — unlimited', 'PDF & Word (.docx) export', 'Version history & imports', 'Free AI tool previews (0 credits)'];

  return (
    <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <Gift size={18} className="text-[var(--accent)]" />
          <h2 className="text-lg font-extrabold">Your signup bonus: {SIGNUP_BONUS_CREDITS} free credits</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <div className="text-3xl font-extrabold text-[var(--accent)]">{RESUMES_FROM_BONUS}</div>
            <div className="text-sm font-semibold">full AI resumes</div>
            <div className="text-xs text-[var(--fg-muted)]">{CREDIT_COSTS.generate} credits each</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
            <div className="text-3xl font-extrabold text-[var(--accent)]">{SIGNUP_BONUS_CREDITS}</div>
            <div className="text-sm font-semibold">AI bullet / chat edits</div>
            <div className="text-xs text-[var(--fg-muted)]">{CREDIT_COSTS.chat_edit} credit each</div>
          </div>
        </div>
        <p className="mt-3 text-xs text-[var(--fg-muted)]">Mix and match — for example 1 resume ({CREDIT_COSTS.generate}) + {SIGNUP_BONUS_CREDITS - CREDIT_COSTS.generate} edits. Credits never expire.</p>
        <div className="mt-5 space-y-2.5">
          {rows.map(({ Icon, label, cost, sub }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon size={16} className="shrink-0 text-[var(--accent)]" />
              <div className="flex-1"><div className="font-semibold">{label}</div><div className="text-xs text-[var(--fg-muted)]">{sub}</div></div>
              <div className="font-bold">{cost}</div>
            </div>
          ))}
        </div>
      </div>
      <div className="glass p-6">
        <div className="mb-4 flex items-center gap-2">
          <InfinityIcon size={18} className="text-emerald-500" />
          <h2 className="text-lg font-extrabold">Always free, never metered</h2>
        </div>
        <ul className="space-y-2.5 text-sm">
          {free.map((f) => (
            <li key={f} className="flex items-start gap-2"><Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />{f}</li>
          ))}
        </ul>
        <div className="mt-5 flex items-center gap-2 rounded-lg bg-[var(--accent)]/10 px-3 py-2 text-xs"><ScanSearch size={14} className="text-[var(--accent)]" /> Re-scan your resume as often as you like — it never costs a credit.</div>
      </div>
    </div>
  );
}

/** Cheapest pack combination covering `needed` credits. */
function cheapest(needed: number, currency: Currency) {
  if (needed <= 0) return { starter: 0, pro: 0, cost: 0, credits: 0 };
  let best = { starter: 0, pro: 0, cost: Infinity, credits: 0 };
  for (let a = 0; a <= 12; a++) {
    for (let b = 0; b <= 12; b++) {
      const credits = a * PLANS.starter.credits + b * PLANS.pro.credits;
      if (credits < needed) continue;
      const cost = a * PLANS.starter.price[currency] + b * PLANS.pro.price[currency];
      if (cost < best.cost || (cost === best.cost && credits > best.credits)) best = { starter: a, pro: b, cost, credits };
    }
  }
  return best;
}

const EXAMPLE_SUB: Record<Currency, number> = { USD: 15, INR: 999 };

/** Interactive glass credit calculator + anti-subscription comparison. */
export function CreditCalculator() {
  const { currency, setCurrency } = useCurrency();
  const [resumes, setResumes] = useState(3);
  const [edits, setEdits] = useState(10);
  const [months, setMonths] = useState(3);
  const [subOverride, setSubOverride] = useState<Partial<Record<Currency, number>>>({});

  const sub = subOverride[currency] ?? EXAMPLE_SUB[currency];
  const needed = resumes * CREDIT_COSTS.generate + edits * CREDIT_COSTS.chat_edit;
  const toBuy = Math.max(0, needed - SIGNUP_BONUS_CREDITS);
  const plan = useMemo(() => cheapest(toBuy, currency), [toBuy, currency]);
  const perCredit = plan.credits ? plan.cost / plan.credits : 0;
  const subTotal = sub * months;

  const packRows = (['starter', 'pro'] as const).map((id) => {
    const p = PLANS[id];
    const price = p.price[currency];
    return { id, name: id === 'starter' ? 'Starter' : 'Pro', credits: p.credits, price, perCredit: price / p.credits, perResume: (price / p.credits) * CREDIT_COSTS.generate };
  });

  const slider = 'w-full accent-[var(--accent)]';

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="glass p-6 sm:p-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-extrabold"><Calculator size={18} className="text-[var(--accent)]" /> Credit calculator</h2>
          <div className="inline-flex rounded-full border border-[var(--border)] p-1">
            {(['USD', 'INR'] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)} className={`rounded-full px-3 py-1 text-xs font-bold ${currency === c ? 'bg-[var(--accent)] text-white' : 'text-[var(--fg-muted)]'}`}>{c === 'USD' ? '$ USD' : '₹ INR'}</button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-5">
            <label className="block text-sm font-semibold">
              Full AI resumes: <span className="text-[var(--accent)]">{resumes}</span>
              <input type="range" min={0} max={12} value={resumes} onChange={(e) => setResumes(+e.target.value)} className={slider} />
            </label>
            <label className="block text-sm font-semibold">
              AI edits / bullet enhances: <span className="text-[var(--accent)]">{edits}</span>
              <input type="range" min={0} max={60} value={edits} onChange={(e) => setEdits(+e.target.value)} className={slider} />
            </label>
            <p className="text-xs text-[var(--fg-muted)]">ATS checks, manual edits and exports are free, so they are not counted.</p>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 text-sm">
            <div className="flex justify-between py-1"><span className="text-[var(--fg-muted)]">Credits you need</span><b>{needed}</b></div>
            <div className="flex justify-between py-1"><span className="text-[var(--fg-muted)]">Covered by signup bonus</span><b className="text-emerald-500">−{Math.min(needed, SIGNUP_BONUS_CREDITS)}</b></div>
            <div className="flex justify-between border-t border-[var(--border)] py-1 pt-2"><span className="text-[var(--fg-muted)]">Still to buy</span><b>{toBuy}</b></div>
            {toBuy > 0 ? (
              <>
                <div className="mt-3 text-xs text-[var(--fg-muted)]">
                  Cheapest way: {plan.starter > 0 && `${plan.starter}× Starter`}{plan.starter > 0 && plan.pro > 0 && ' + '}{plan.pro > 0 && `${plan.pro}× Pro`} ({plan.credits} credits)
                </div>
                <div className="mt-1 text-3xl font-extrabold text-[var(--accent)]">{money(currency, plan.cost)}</div>
                <div className="text-xs text-[var(--fg-muted)]">one-time · {money(currency, perCredit)} per credit · {money(currency, perCredit * CREDIT_COSTS.generate)} per full resume</div>
              </>
            ) : (
              <div className="mt-3 text-3xl font-extrabold text-emerald-500">{money(currency, 0)}</div>
            )}
            {toBuy === 0 && <div className="text-xs text-[var(--fg-muted)]">Your free signup credits cover this.</div>}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead><tr className="text-xs uppercase text-[var(--fg-muted)]"><th className="py-2">Pack</th><th>Credits</th><th>Price</th><th>Per credit</th><th>Per full resume</th></tr></thead>
            <tbody>
              {packRows.map((r) => (
                <tr key={r.id} className="border-t border-[var(--border)]"><td className="py-2 font-bold">{r.name}</td><td>{r.credits}</td><td>{formatPrice(currency, r.price)}</td><td>{money(currency, r.perCredit)}</td><td>{money(currency, r.perResume)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="glass p-6 sm:p-8">
        <h2 className="text-lg font-extrabold">One-time credits vs. auto-renewing subscriptions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="text-xs uppercase text-[var(--fg-muted)]"><th className="py-2" /><th className="text-[var(--accent)]">QuantumCV credits</th><th>Typical monthly subscription</th></tr></thead>
            <tbody>
              {[
                ['Billing', 'Pay once per pack', 'Renews every month until cancelled'],
                ['Expiry', 'Credits never expire', 'Access or allowance ends with the plan'],
                ['Cancel to stop paying', 'Nothing to cancel', 'You must remember to cancel'],
                ['ATS score checks', 'Free & unlimited', 'Often limited or behind the paywall'],
              ].map(([k, a, b]) => (
                <tr key={k} className="border-t border-[var(--border)]">
                  <td className="py-2.5 font-semibold">{k}</td>
                  <td><span className="inline-flex items-center gap-1.5"><Check size={14} className="text-emerald-500" />{a}</span></td>
                  <td><span className="inline-flex items-center gap-1.5 text-[var(--fg-muted)]"><X size={14} className="text-red-500" />{b}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-4">
            <label className="block text-sm font-semibold">
              Months you’d stay subscribed: <span className="text-[var(--accent)]">{months}</span>
              <input type="range" min={1} max={6} value={months} onChange={(e) => setMonths(+e.target.value)} className={slider} />
            </label>
            <label className="block text-sm font-semibold">
              Example subscription price / month
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[var(--fg-muted)]">{currency === 'INR' ? '₹' : '$'}</span>
                <input type="number" min={0} value={sub} onChange={(e) => setSubOverride({ ...subOverride, [currency]: Math.max(0, +e.target.value) })} className="w-28 rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm" />
              </div>
              <span className="mt-1 block text-[11px] font-normal text-[var(--fg-muted)]">An illustrative figure — type in whatever you were quoted.</span>
            </label>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 text-sm">
            <div className="flex justify-between py-1"><span className="text-[var(--fg-muted)]">Subscription × {months} mo</span><b>{money(currency, subTotal)}</b></div>
            <div className="flex justify-between py-1"><span className="text-[var(--fg-muted)]">QuantumCV (your plan above)</span><b className="text-[var(--accent)]">{money(currency, plan.cost)}</b></div>
            <div className="flex justify-between border-t border-[var(--border)] py-1 pt-2"><span className="font-semibold">You keep</span><b className="text-emerald-500">{money(currency, Math.max(0, subTotal - plan.cost))}</b></div>
          </div>
        </div>
      </div>
    </div>
  );
}
