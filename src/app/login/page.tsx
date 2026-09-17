'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, ShieldCheck, LayoutTemplate, History, ArrowLeft } from 'lucide-react';
import GoogleSignInButton from '@/components/google-sign-in-button';
import ThemeToggle from '@/components/theme-toggle';

const FEATURES = [
  { Icon: Sparkles, title: 'Gemini AI Engine', desc: 'STAR bullets, smart section ordering, ATS keyword alignment' },
  { Icon: ShieldCheck, title: 'Global ATS Optimised', desc: 'Naukri, LinkedIn, Workday, Greenhouse and 20+ job boards' },
  { Icon: LayoutTemplate, title: '30 Professional Templates', desc: 'Drag, edit, reorder — every element is fully customisable' },
  { Icon: History, title: 'Version History', desc: 'Never lose a change — restore any previous version instantly' },
];

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) setMessage({ text: data.message, error: true });
      else {
        setStep('otp');
        setMessage({ text: data.message });
      }
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, full_name: fullName }),
      });
      const data = await res.json();
      if (!data.success) setMessage({ text: data.message, error: true });
      else router.push(data.redirect ?? '/dashboard');
    } finally {
      setLoading(false);
    }
  }

  async function resend() {
    setMessage(null);
    const res = await fetch('/api/auth/resend-otp', { method: 'POST' });
    const data = await res.json();
    setMessage({ text: data.message, error: !data.success });
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: brand, headline, feature grid */}
          <div className="flex flex-col justify-center gap-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <img src="/logo.png" alt="" className="w-12 h-12 rounded-xl shadow-lg" />
                <div>
                  <div className="text-sm font-semibold">QuantumCV</div>
                  <div className="text-xs text-[var(--fg-muted)]">AI · ATS · Professional</div>
                </div>
              </div>

              <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                Build a resume from your <span className="text-[var(--accent)]">raw career data</span>
              </h1>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4">
              {FEATURES.slice(0, 4).map((f) => (
                <div key={f.title} className="flex gap-3 items-start rounded-xl border border-[var(--border)] p-3 hover:border-[var(--accent)]/40 hover:shadow-lg transition-all">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-[var(--accent)]/10 flex items-center justify-center">
                    <f.Icon size={16} strokeWidth={1.75} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{f.title}</div>
                    <div className="text-xs text-[var(--fg-muted)]">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden sm:block">
              <img src="/assets/login-illustration.svg" alt="" className="w-full max-w-md opacity-90" />
            </div>
          </div>

          {/* Right: auth card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-[var(--bg-subtle)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold mb-0">{step === 'email' ? 'Welcome back' : 'Enter verification code'}</h2>
                  <p className="text-sm text-[var(--fg-muted)]">{step === 'email' ? "Sign in quickly — we'll email a one-time code." : `Code sent to ${email}`}</p>
                </div>
                <img src="/logo.png" alt="" className="hidden lg:block w-10 h-10 rounded-full shadow" />
              </div>

              {message && (
                <div className={`text-sm rounded-lg px-3 py-2 mb-4 ${message.error ? 'bg-red-500/10 text-red-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'}`}>
                  {message.text}
                </div>
              )}

              <div className="space-y-4">
                {step === 'email' && (
                  <>
                    <GoogleSignInButton />
                    <div className="flex items-center gap-3 my-2">
                      <div className="h-px bg-[var(--border)] flex-1" />
                      <span className="text-xs text-[var(--fg-muted)]">or continue with email</span>
                      <div className="h-px bg-[var(--border)] flex-1" />
                    </div>
                  </>
                )}

                {step === 'email' ? (
                  <form onSubmit={sendOtp} className="space-y-4">
                    <label className="sr-only">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                      aria-label="Email address"
                    />
                    <button
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Sending…' : 'Send verification code'}
                    </button>
                    <div className="text-center text-xs text-[var(--fg-muted)]">No password required. We’ll email a secure code.</div>
                  </form>
                ) : (
                  <form onSubmit={verify} className="space-y-4">
                    <label className="sr-only">Verification code</label>
                    <input
                      type="text"
                      required
                      placeholder="6-digit code"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm tracking-[0.3em] text-center font-mono placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                      aria-label="Verification code"
                    />

                    <input
                      type="text"
                      placeholder="Full name (first time only)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm placeholder:text-[var(--fg-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-[var(--accent)]"
                    />

                    <button
                      disabled={loading}
                      className="w-full rounded-lg bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors shadow-lg hover:shadow-xl"
                    >
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>

                    <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                      <button type="button" onClick={() => setStep('email')} className="hover:text-[var(--fg)] transition-colors">← Change email</button>
                      <button type="button" onClick={resend} className="hover:text-[var(--fg)] transition-colors">Resend code</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-6 text-center text-xs text-[var(--fg-muted)]">
                By signing in you agree to our <Link href="/terms" className="underline hover:text-[var(--fg)]">Terms</Link> and <Link href="/privacy" className="underline hover:text-[var(--fg)]">Privacy Policy</Link>.
              </div>
            </div>
          </div>

        </div>
      </div>

      <div className="fixed top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] transition-colors rounded-full px-3 py-2 hover:bg-[var(--bg-subtle)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>
      <div className="fixed top-6 right-6"><ThemeToggle /></div>
    </div>
  );
}
