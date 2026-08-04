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
    <div className="min-h-screen grid lg:grid-cols-2 bg-[var(--bg)] text-[var(--fg)]">
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col justify-center bg-black text-white px-16 relative">
        <Link href="/" className="absolute top-8 left-16 flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
          <ArrowLeft size={15} /> Back to home
        </Link>
        <div className="flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold">Q</div>
          <span className="text-lg font-extrabold tracking-tight">QuantumCV</span>
        </div>
        <h1 className="text-4xl font-extrabold leading-tight mb-4">
          Build resumes that get you <span className="text-[var(--accent)]">hired.</span>
        </h1>
        <p className="text-white/50 mb-10 max-w-md">
          AI-powered resume architecture — optimised for ATS systems, recruiters, and every role you want.
        </p>
        <div className="space-y-5">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex gap-3">
              <f.Icon size={19} strokeWidth={1.75} className="text-[var(--accent)] shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-sm">{f.title}</div>
                <div className="text-white/45 text-sm">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auth form */}
      <div className="flex flex-col justify-center items-center px-6 relative">
        <div className="absolute top-6 right-6"><ThemeToggle /></div>
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="w-9 h-9 rounded-full bg-[var(--accent)] flex items-center justify-center font-bold text-white">Q</div>
            <span className="text-lg font-extrabold tracking-tight">QuantumCV</span>
          </div>

          <h2 className="text-2xl font-extrabold mb-1">{step === 'email' ? 'Sign in' : 'Enter verification code'}</h2>
          <p className="text-[var(--fg-muted)] text-sm mb-6">
            {step === 'email' ? "No password needed — we'll email you a one-time code." : `Code sent to ${email}`}
          </p>

          {message && (
            <div
              className={`text-sm rounded-lg px-3 py-2 mb-4 ${
                message.error ? 'bg-red-500/10 text-red-500' : 'bg-[var(--accent)]/10 text-[var(--accent)]'
              }`}
            >
              {message.text}
            </div>
          )}

          {step === 'email' && (
            <>
              <GoogleSignInButton />
              <div className="flex items-center gap-3 my-5">
                <div className="h-px bg-[var(--border)] flex-1" />
                <span className="text-xs text-[var(--fg-muted)]">or continue with email</span>
                <div className="h-px bg-[var(--border)] flex-1" />
              </div>
            </>
          )}

          {step === 'email' ? (
            <form onSubmit={sendOtp} className="space-y-4">
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                disabled={loading}
                className="w-full rounded-full bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending…' : 'Send verification code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verify} className="space-y-4">
              <input
                type="text"
                required
                placeholder="6-digit code"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm tracking-[0.3em] text-center font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <input
                type="text"
                placeholder="Full name (first time only)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-full border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button
                disabled={loading}
                className="w-full rounded-full bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
              >
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <div className="flex justify-between text-xs text-[var(--fg-muted)]">
                <button type="button" onClick={() => setStep('email')} className="hover:text-[var(--fg)] transition-colors">
                  ← Change email
                </button>
                <button type="button" onClick={resend} className="hover:text-[var(--fg)] transition-colors">
                  Resend code
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
