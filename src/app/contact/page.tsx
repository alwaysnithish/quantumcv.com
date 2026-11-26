'use client';

import { useState } from 'react';
import { Mail, Send, Loader2, CheckCircle2, MessageCircle, Clock } from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ScrollReveal from '@/components/scroll-reveal';
import { XIcon, LinkedInIcon, InstagramIcon, YouTubeIcon } from '@/components/brand-icons';

const SOCIALS = [
  { Icon: XIcon, href: 'https://x.com/quantumcv', label: 'X (Twitter)' },
  { Icon: LinkedInIcon, href: 'https://linkedin.com/company/quantumcv', label: 'LinkedIn' },
  { Icon: InstagramIcon, href: 'https://instagram.com/quantumcv', label: 'Instagram' },
  { Icon: YouTubeIcon, href: 'https://youtube.com/@quantumcv', label: 'YouTube' },
];

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/support/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: email ? `${message}\n\n— reply to: ${email}` : message }),
      });
      const data = await res.json();
      if (data?.success === false) throw new Error(data.message || 'Could not send your message.');
      setSent(true);
      setMessage('');
      setEmail('');
    } catch {
      setError('Something went wrong sending that. Please try emailing us directly instead.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main>
        <section className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--accent)_14%,transparent),transparent_42%)]">
          <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <ScrollReveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                <MessageCircle size={14} className="text-[var(--accent)]" /> Contact
              </div>
              <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-[-0.055em] leading-[0.98]">Talk to a human.</h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--fg-muted)]">
                Question about billing, a bug you ran into, or feedback on a template — send it over and we&apos;ll get back to you.
              </p>
            </ScrollReveal>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24 grid lg:grid-cols-[1fr_minmax(0,26rem)] gap-12">
          <ScrollReveal>
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-6 sm:p-8">
              {sent ? (
                <div className="py-10 text-center">
                  <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={22} className="text-[var(--accent)]" />
                  </div>
                  <p className="font-bold">Message sent</p>
                  <p className="mt-1.5 text-sm text-[var(--fg-muted)]">Thanks — we typically reply within a day, by email too.</p>
                  <button
                    onClick={() => setSent(false)}
                    className="mt-6 text-sm font-semibold text-[var(--accent)]"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Your email (optional)</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                    <p className="mt-1.5 text-[11px] text-[var(--fg-muted)]">If you&apos;re signed in, we already know how to reach you — this is only needed for a direct reply elsewhere.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--fg-muted)] uppercase tracking-wide">Message</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={7}
                      required
                      placeholder="What's going on?"
                      className="mt-1.5 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3.5 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                    />
                  </div>
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <button
                    type="submit"
                    disabled={sending || !message.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-6 py-3 hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-colors"
                  >
                    {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    {sending ? 'Sending…' : 'Send message'}
                  </button>
                </form>
              )}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.06}>
            <div className="space-y-5">
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-2 text-sm font-bold mb-1"><Mail size={15} className="text-[var(--accent)]" /> Email</div>
                <a href="mailto:support@quantumcv.app" className="text-sm text-[var(--fg-muted)] hover:text-[var(--accent)] transition-colors">support@quantumcv.app</a>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-2 text-sm font-bold mb-1"><Clock size={15} className="text-[var(--accent)]" /> Response time</div>
                <p className="text-sm text-[var(--fg-muted)]">Usually within a day. Pro plan messages are prioritised.</p>
              </div>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="text-sm font-bold mb-3">Follow along</div>
                <div className="flex gap-3">
                  {SOCIALS.map((s) => (
                    <a
                      key={s.label}
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={s.label}
                      className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center text-[var(--fg-muted)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors"
                    >
                      <s.Icon size={16} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </section>
      </main>
      <Footer />
    </div>
  );
}