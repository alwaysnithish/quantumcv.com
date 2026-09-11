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
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#071133] to-[#0b1220] text-[var(--fg)]">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

           <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[var(--accent)] to-[#7dd3fc] flex items-center justify-center text-white font-extrabold shadow-lg">Q</div>
              <div>
                <div className="text-sm text-white/70">QuantumCV</div>
                <div className="text-xs text-white/40">AI · ATS · Professional</div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight text-white">
              Build a resume from your <span className="text-[var(--accent)]">raw career data</span>
            </h1>

          {/* Right auth card */}
          <div className="flex justify-center">
            <div className="w-full max-w-md bg-white/5 backdrop-blur-md border border-white/8 rounded-2xl p-8 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-extrabold text-white mb-0">{step === 'email' ? 'Welcome back' : 'Enter verification code'}</h2>
                  <p className="text-sm text-white/60">{step === 'email' ? "Sign in quickly — we'll email a one-time code." : `Code sent to ${email}`}</p>
                </div>
                <div className="hidden lg:flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent)] flex items-center justify-center text-white font-bold">Q</div>
                </div>
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
                      <div className="h-px bg-white/8 flex-1" />
                      <span className="text-xs text-white/60">or continue with email</span>
                      <div className="h-px bg-white/8 flex-1" />
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
                      className="w-full rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      aria-label="Email address"
                    />
                    <button disabled={loading} className="w-full rounded-full bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition">
                      {loading ? 'Sending…' : 'Send verification code'}
                    </button>
                    <div className="text-center text-xs text-white/50">No password required. We’ll email a secure code.</div>
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
                      className="w-full rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm tracking-[0.3em] text-center font-mono text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      aria-label="Verification code"
                    />

                    <input
                      type="text"
                      placeholder="Full name (first time only)"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />

                    <button disabled={loading} className="w-full rounded-full bg-[var(--accent)] text-white font-semibold py-2.5 text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50 transition">
                      {loading ? 'Verifying…' : 'Verify & sign in'}
                    </button>

                    <div className="flex justify-between text-xs text-white/60">
                      <button type="button" onClick={() => setStep('email')} className="hover:text-white transition">← Change email</button>
                      <button type="button" onClick={resend} className="hover:text-white transition">Resend code</button>
                    </div>
                  </form>
                )}
              </div>

              <div className="mt-6 text-center text-xs text-white/50">
                By signing in you agree to our <Link href="/terms" className="underline">Terms</Link> and <Link href="/privacy" className="underline">Privacy Policy</Link>.
              </div>
            </div>
          </div>
          {/* Left showcase / brand */}
          <div className="flex flex-col justify-center gap-8">
           
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mt-4">
              {FEATURES.slice(0,4).map((f) => (
                <div key={f.title} className="flex gap-3 items-start bg-white/6 backdrop-blur-sm rounded-xl p-3 border border-white/6">
                  <f.Icon size={18} strokeWidth={1.6} className="text-[var(--accent)] mt-1" />
                  <div>
                    <div className="text-sm font-semibold text-white">{f.title}</div>
                    <div className="text-xs text-white/60">{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* <div className="mt-6 flex gap-4">
             // <Link href="/pricing" className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-lg shadow hover:shadow-lg">Explore templates</Link>
             // <Link href="/" className="inline-flex items-center gap-2 border border-white/10 text-white/90 px-4 py-2 rounded-lg">Learn more</Link>
           // </div> */}

            <div className="hidden sm:block mt-6">
              <img src="/assets/login-illustration.svg" alt="" className="w-full max-w-md opacity-95" />
            </div>
          </div>

        </div>
      </div>

      <div className="fixed top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white transition rounded-full px-3 py-2 hover:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>
      </div>
      <div className="fixed top-6 right-6"><ThemeToggle /></div>
    </div>
  );
}