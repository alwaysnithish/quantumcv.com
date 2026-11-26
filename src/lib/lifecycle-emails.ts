/**
 * src/lib/lifecycle-emails.ts
 *
 * Branded transactional + lifecycle emails, delivered through the existing
 * sendEmail() (Resend -> SMTP -> dev console).
 *
 *  - sendWelcomeEmail          on signup
 *  - sendCreditNudgeEmail      48h+ later if the free credits are untouched
 *  - sendReferralRewardEmail   when a friend's first ATS scan pays out
 *  - sendAtsReportEmail        full ATS diagnostic after a scan
 *
 * Every dynamic value is HTML-escaped. Lifecycle mail (welcome, nudge) carries
 * a signed one-click unsubscribe link; the user's emailOptOut flag is honoured
 * by the cron job that sends nudges.
 */
import { SignJWT, jwtVerify } from 'jose';
import { sendEmail } from './email';
import { CREDIT_COSTS, SIGNUP_BONUS_CREDITS, REFERRAL_REWARD_CREDITS, REFERRAL_UNLOCK_COUNT, SITE_URL } from './credit-config';

const esc = (v: unknown) =>
  String(v ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

// ── unsubscribe tokens ───────────────────────────────
function secret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET ?? '');
}
export async function makeUnsubscribeToken(userId: string) {
  return new SignJWT({ uid: userId, purpose: 'unsub' }).setProtectedHeader({ alg: 'HS256' }).setExpirationTime('365d').sign(secret());
}
export async function verifyUnsubscribeToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload.purpose === 'unsub' ? (payload.uid as string) : null;
  } catch {
    return null;
  }
}

// ── shared layout ────────────────────────────────────
const btn = (href: string, label: string) =>
  `<a href="${esc(href)}" style="display:inline-block;background:#1d9bf0;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 26px;border-radius:999px">${esc(label)}</a>`;

function layout(inner: string, unsubscribeUrl?: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:24px 12px;background:#eef3f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #dbe4ef;border-radius:16px;padding:36px 32px;color:#0f172a">
<div style="font-size:18px;font-weight:800;letter-spacing:-.4px;margin-bottom:24px"><span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;background:#1d9bf0;color:#fff;border-radius:8px;margin-right:8px">Q</span>QuantumCV</div>
${inner}
<div style="margin-top:32px;padding-top:18px;border-top:1px solid #eef2f7;font-size:12px;color:#94a3b8;line-height:1.6">
© QuantumCV · <a href="${SITE_URL}" style="color:#94a3b8">quantumcv.app</a>${
    unsubscribeUrl ? ` · <a href="${esc(unsubscribeUrl)}" style="color:#94a3b8">Unsubscribe from reminders</a>` : ''
  }</div></div></body></html>`;
}

const h = (t: string) => `<h2 style="font-size:22px;font-weight:800;margin:0 0 10px;letter-spacing:-.4px">${esc(t)}</h2>`;
const p = (t: string) => `<p style="font-size:15px;line-height:1.65;color:#475569;margin:0 0 16px">${t}</p>`;

const unsubUrl = async (userId: string) => `${SITE_URL}/api/email/unsubscribe?token=${await makeUnsubscribeToken(userId)}`;
const first = (name: string) => esc((name || '').trim().split(/\s+/)[0] || 'there');

// ── welcome ──────────────────────────────────────────
export async function sendWelcomeEmail(user: { id: string; email: string; fullName: string }) {
  const resumes = Math.floor(SIGNUP_BONUS_CREDITS / CREDIT_COSTS.generate);
  const html = layout(
    h(`Welcome, ${first(user.fullName)} 👋`) +
      p(`Your account is live with <b>${SIGNUP_BONUS_CREDITS} free credits</b> — no card, no subscription.`) +
      `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:16px 18px;margin-bottom:20px;font-size:14px;line-height:1.8;color:#0f172a">
<b>What ${SIGNUP_BONUS_CREDITS} credits buy:</b><br>
• ${resumes} full AI resumes (${CREDIT_COSTS.generate} credits each), <i>or</i><br>
• ${SIGNUP_BONUS_CREDITS} AI bullet / chat edits (${CREDIT_COSTS.chat_edit} credit each)<br>
• <b>ATS score checks and manual edits are always free &amp; unlimited</b></div>` +
      p('<b>Quick start (2 minutes):</b><br>1. Run a free ATS scan on your current resume<br>2. Open the builder and import it, or paste your career details<br>3. Download as PDF or editable Word') +
      `<div style="margin:24px 0">${btn(`${SITE_URL}/resumeanalyser`, 'Run my free ATS scan')}</div>` +
      p(`Tip: invite a friend — when they finish their first scan you both get +${REFERRAL_REWARD_CREDITS} credits.`),
    await unsubUrl(user.id)
  );
  const text = `Welcome to QuantumCV!\n\nYou have ${SIGNUP_BONUS_CREDITS} free credits: ${resumes} full AI resumes or ${SIGNUP_BONUS_CREDITS} AI edits. ATS checks and manual edits are free and unlimited.\n\nStart: ${SITE_URL}/resumeanalyser`;
  return sendEmail({ to: user.email, subject: `Welcome to QuantumCV — your ${SIGNUP_BONUS_CREDITS} free credits are ready`, html, text });
}

// ── 48h nudge ────────────────────────────────────────
export async function sendCreditNudgeEmail(user: { id: string; email: string; fullName: string; credits: number }) {
  const html = layout(
    h(`${first(user.fullName)}, your ${esc(user.credits)} free credits are waiting`) +
      p(`You haven't used them yet — that's enough for <b>${Math.floor(user.credits / CREDIT_COSTS.generate)} full AI resume${Math.floor(user.credits / CREDIT_COSTS.generate) === 1 ? '' : 's'}</b>. They never expire, but recruiters don't wait.`) +
      p('Already have a resume? Import it (PDF or Word), let the AI sharpen the bullets, and download an ATS-safe PDF or editable .docx.') +
      `<div style="margin:24px 0">${btn(`${SITE_URL}/builder`, 'Build my resume')}</div>`,
    await unsubUrl(user.id)
  );
  const text = `You still have ${user.credits} free credits on QuantumCV. Build your resume: ${SITE_URL}/builder`;
  return sendEmail({ to: user.email, subject: `Your ${user.credits} free QuantumCV credits are still unused`, html, text });
}

// ── referral reward ──────────────────────────────────
export async function sendReferralRewardEmail(params: {
  to: { id: string; email: string; fullName: string };
  friendName: string;
  role: 'referrer' | 'friend';
  totalRewarded?: number;
  unlockedTemplates?: boolean;
}) {
  const { to, friendName, role, totalRewarded = 0, unlockedTemplates } = params;
  const remaining = Math.max(0, REFERRAL_UNLOCK_COUNT - totalRewarded);
  const lead =
    role === 'referrer'
      ? `${esc(friendName)} just finished their first ATS scan — you both earned <b>+${REFERRAL_REWARD_CREDITS} credits</b>.`
      : `You finished your first ATS scan, so you and your friend each earned <b>+${REFERRAL_REWARD_CREDITS} credits</b>.`;
  const extra =
    role === 'referrer'
      ? unlockedTemplates
        ? p('🎉 <b>That’s 3 referrals — all premium templates are now unlocked on your account.</b>')
        : remaining > 0
          ? p(`${remaining} more referral${remaining === 1 ? '' : 's'} unlocks every premium template.`)
          : ''
      : '';
  const html = layout(h(`+${REFERRAL_REWARD_CREDITS} credits added 🎁`) + p(lead) + extra + `<div style="margin:24px 0">${btn(`${SITE_URL}/refer`, role === 'referrer' ? 'Invite another friend' : 'Use my credits')}</div>`, await unsubUrl(to.id));
  const text = `+${REFERRAL_REWARD_CREDITS} credits added to your QuantumCV account. ${SITE_URL}/refer`;
  return sendEmail({ to: to.email, subject: `+${REFERRAL_REWARD_CREDITS} bonus credits just landed`, html, text });
}

// ── ATS diagnostic report ────────────────────────────
function kw(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') return String((v as any).keyword ?? '');
  return '';
}

export async function sendAtsReportEmail(user: { id: string; email: string; fullName: string; credits: number }, report: any, role?: string) {
  const score = Math.max(0, Math.min(100, Math.round(Number(report?.overall_score ?? 0))));
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626';
  const breakdown: { label: string; score: number | null; reason: string }[] = (report?.score_breakdown ?? []).slice(0, 8);
  const missing = Array.from(
    new Set<string>(
      [...(report?.ats_review?.missing_keywords ?? []), ...(report?.role_specific_improvements?.missing_important_keywords ?? [])].map(kw).filter(Boolean)
    )
  ).slice(0, 12);
  const fixes: { title: string; how: string }[] = (report?.top_5_improvements ?? [])
    .slice(0, 3)
    .map((f: any) => ({ title: String(f.title ?? ''), how: String(f.how_to_fix ?? '') }))
    .filter((f: any) => f.title);

  const rows = breakdown
    .map((b) => {
      const s = b.score == null ? null : Math.round(b.score);
      const c = s == null ? '#94a3b8' : s >= 80 ? '#16a34a' : s >= 60 ? '#d97706' : '#dc2626';
      return `<tr><td style="padding:10px 0;border-top:1px solid #eef2f7;font-size:14px;color:#0f172a"><b>${esc(b.label)}</b><div style="font-size:12px;color:#64748b;margin-top:2px">${esc(b.reason)}</div></td><td style="padding:10px 0 10px 12px;border-top:1px solid #eef2f7;text-align:right;font-weight:800;font-size:16px;color:${c};white-space:nowrap">${s == null ? 'n/a' : s}</td></tr>`;
    })
    .join('');

  const html = layout(
    h('Your ATS Diagnostic Report') +
      (role ? p(`Target role: <b>${esc(role)}</b>`) : '') +
      `<div style="text-align:center;margin:8px 0 22px"><div style="display:inline-block;width:110px;height:110px;line-height:110px;border-radius:50%;border:9px solid ${color};font-size:38px;font-weight:800;color:${color}">${score}</div><div style="margin-top:10px;font-size:15px;font-weight:700">${esc(report?.verdict ?? '')}</div></div>` +
      (report?.executive_summary ? p(esc(report.executive_summary)) : '') +
      (rows ? `<h3 style="font-size:15px;margin:22px 0 4px">Section-by-section breakdown</h3><table style="width:100%;border-collapse:collapse">${rows}</table>` : '') +
      (missing.length
        ? `<h3 style="font-size:15px;margin:24px 0 8px">Missing keywords</h3><div>${missing.map((m) => `<span style="display:inline-block;background:#fef2f2;color:#b91c1c;border-radius:999px;padding:4px 11px;margin:0 6px 6px 0;font-size:12px;font-weight:600">${esc(m)}</span>`).join('')}</div>`
        : '') +
      (fixes.length
        ? `<h3 style="font-size:15px;margin:24px 0 8px">Fix these first</h3>${fixes.map((f, i) => `<p style="font-size:14px;line-height:1.6;color:#334155;margin:0 0 10px"><b>${i + 1}. ${esc(f.title)}</b><br>${esc(f.how)}</p>`).join('')}`
        : '') +
      `<div style="margin:28px 0 8px;text-align:center">${btn(`${SITE_URL}/builder`, `Fix my resume with ${user.credits} free credits`)}</div>` +
      `<p style="font-size:12px;color:#94a3b8;text-align:center">Re-scanning is always free and unlimited.</p>`
  );
  const text = `Your ATS score: ${score}/100 — ${report?.verdict ?? ''}\n\nMissing keywords: ${missing.join(', ') || 'none flagged'}\n\nFix your resume: ${SITE_URL}/builder`;
  return sendEmail({ to: user.email, subject: `Your ATS score is ${score}/100 — full report inside`, html, text });
}
