import Link from 'next/link';
import { ArrowRight, Sparkles, MessageSquareText, Wand2, LayoutTemplate, ShieldCheck, History } from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ScrollReveal from '@/components/scroll-reveal';
import PricingCards from '@/components/pricing-cards';
import { getCurrentUserId } from '@/lib/session';

const FEATURES = [
  {
    Icon: Sparkles,
    title: 'AI Resume Generation',
    desc: 'Paste your raw career history and a target role — Gemini writes a fully structured, ATS-optimised resume in seconds, tailored to the job description.',
  },
  {
    Icon: MessageSquareText,
    title: 'AI Resume Chat',
    desc: 'Just tell it what you want: "add a skills section with bars," "make this bullet punchier," "add languages." No forms — plain conversation edits your resume live.',
  },
  {
    Icon: Wand2,
    title: 'AI Bullet Enhancer',
    desc: 'One click turns a flat line into a quantified, action-verb-led, ATS-friendly bullet point — for any line, anywhere in your resume.',
  },
  {
    Icon: LayoutTemplate,
    title: '30 Professional Templates',
    desc: 'From minimalist to bold, academic to creative — fully editable, drag-and-drop sections, skill bars, dots, tags, and tables.',
  },
  {
    Icon: ShieldCheck,
    title: 'Built for ATS',
    desc: 'Real, selectable text — not a screenshot. Every template is checked against how ATS systems actually parse resumes.',
  },
  {
    Icon: History,
    title: 'Version History',
    desc: "Every save is tracked. Restore any earlier version instantly if an edit didn't work out.",
  },
];

const STEPS = [
  { n: '01', title: 'Paste your career data', desc: 'Education, experience, projects, skills — in your own words, no rigid form.' },
  { n: '02', title: 'AI builds your resume', desc: 'Gemini structures it into a polished, ATS-ready resume tailored to your target role.' },
  { n: '03', title: 'Edit by chatting', desc: "Refine anything by typing what you want changed — or click directly on the page." },
  { n: '04', title: 'Export & apply', desc: 'Download a real, selectable-text PDF that passes ATS parsing, ready to send.' },
];

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const ctaHref = userId ? '/dashboard' : '/login';
  const ctaLabel = userId ? 'Go to dashboard' : 'Start building free';
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />

      <section className="max-w-6xl mx-auto px-5 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--fg-muted)] mb-8">
            <Sparkles size={13} className="text-[var(--accent)]" />
            Powered by Gemini AI
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6">
            Build a resume that <span className="text-[var(--accent)]">actually</span> gets you hired.
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="text-base sm:text-lg text-[var(--fg-muted)] max-w-xl mx-auto mb-10 leading-relaxed">
            AI-powered resume generation, live chat-based editing, and 30 ATS-optimised templates —
            all in one place. No forms. No fighting with Word.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href={ctaHref}
              className="w-full sm:w-auto rounded-full bg-[var(--accent)] text-white font-semibold px-7 py-3 text-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2"
            >
              {ctaLabel} <ArrowRight size={16} />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto rounded-full border border-[var(--border)] font-semibold px-7 py-3 text-sm hover:bg-[var(--bg-subtle)] transition-colors"
            >
              See pricing
            </a>
          </div>
        </ScrollReveal>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Everything you need, nothing you don't</h2>
            <p className="text-[var(--fg-muted)] max-w-lg mx-auto">A complete AI resume workflow — from raw career data to a polished, downloadable PDF.</p>
          </div>
        </ScrollReveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 0.08}>
              <div className="rounded-2xl border border-[var(--border)] p-6 h-full hover:border-[var(--accent)]/40 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                  <f.Icon size={20} className="text-[var(--accent)]" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="bg-[var(--bg-subtle)] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">How it works</h2>
              <p className="text-[var(--fg-muted)]">Four steps from blank page to a resume you're proud to send.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.n} delay={i * 0.1}>
                <div>
                  <div className="text-4xl font-extrabold text-[var(--accent)]/25 mb-3">{s.n}</div>
                  <h3 className="font-bold mb-1.5">{s.title}</h3>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{s.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
        <ScrollReveal>
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Simple, pay-as-you-go pricing</h2>
            <p className="text-[var(--fg-muted)]">No subscriptions. Buy credits once, use them whenever you need them.</p>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <PricingCards />
        </ScrollReveal>
      </section>

      <section className="max-w-4xl mx-auto px-5 py-20 sm:py-28 text-center">
        <ScrollReveal>
          <div className="rounded-3xl bg-black text-white px-8 py-16 sm:py-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">Ready to build your resume?</h2>
            <p className="text-white/60 mb-8 max-w-md mx-auto">Get your first resume generated in under two minutes — free credits included.</p>
            <Link
              href={ctaHref}
              className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] text-white font-semibold px-7 py-3 text-sm hover:bg-[var(--accent-hover)] transition-colors"
            >
              {ctaLabel} <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}
