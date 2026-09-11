import Link from 'next/link';
import { ArrowRight, Sparkles, MessageSquareText, Wand2, LayoutTemplate, ShieldCheck, History, CheckCircle2, AlertCircle, TrendingUp, Zap } from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ScrollReveal from '@/components/scroll-reveal';
import PricingCards from '@/components/pricing-cards';
import HomeLiveBuilder from '@/components/home-live-builder';
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

const ANALYSIS_ITEMS = [
  { icon: CheckCircle2, color: 'text-green-500', label: 'Strengths', items: ['Quantified achievements', 'Action verbs used', 'ATS-friendly format', 'Relevant keywords'] },
  { icon: AlertCircle, color: 'text-yellow-500', label: 'Areas to improve', items: ['Vague bullet points', 'Missing metrics', 'Weak formatting', 'Keyword gaps'] },
  { icon: TrendingUp, color: 'text-blue-500', label: 'Score boost tips', items: ['Add numbers & percentages', 'Use power words', 'Tailor to job desc', 'Improve spacing'] },
];

export default async function HomePage() {
  const userId = await getCurrentUserId();
  const ctaHref = userId ? '/dashboard' : '/login';
  const ctaLabel = userId ? 'Go to dashboard' : 'Start building free';
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-5 pt-16 pb-12 sm:pt-24 sm:pb-16 text-center">
        <ScrollReveal>
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--fg-muted)] mb-6">
            <Sparkles size={13} className="text-[var(--accent)]" />
            Powered by Gemini AI
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.1}>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Build a resume from your <span className="text-[var(--accent)]">raw career data</span>
          </h1>
        </ScrollReveal>
        <ScrollReveal delay={0.2}>
          <p className="text-base sm:text-lg text-[var(--fg-muted)] mb-8 leading-relaxed max-w-2xl mx-auto">
            AI-powered resume generation, live chat-based editing, and 30 ATS-optimised templates — all in one place. No forms. No fighting with Word.
          </p>
        </ScrollReveal>
        <ScrollReveal delay={0.3}>
          <div className="flex flex-col sm:flex-row gap-3 mb-10 justify-center">
            <Link
              href={ctaHref}
              className="rounded-lg bg-[var(--accent)] text-white font-semibold px-6 py-3.5 text-sm hover:bg-[var(--accent-hover)] transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {ctaLabel} <ArrowRight size={16} />
            </Link>
            <a
              href="#pricing"
              className="rounded-lg border border-[var(--border)] font-semibold px-6 py-3.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors"
            >
              View pricing
            </a>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={0.4}>
          <div className="flex flex-row flex-wrap gap-8 text-sm justify-center">
            <div>
              <div className="font-bold text-[var(--accent)] text-lg">30+</div>
              <p className="text-[var(--fg-muted)]">Professional templates</p>
            </div>
            <div>
              <div className="font-bold text-[var(--accent)] text-lg">100%</div>
              <p className="text-[var(--fg-muted)]">ATS compatible</p>
            </div>
            <div>
              <div className="font-bold text-[var(--accent)] text-lg">&lt;2min</div>
              <p className="text-[var(--fg-muted)]">First resume</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Live Preview — full-width, below the hero copy, on every device */}
      <section className="max-w-[1400px] mx-auto px-5 pb-20 sm:pb-28">
        <ScrollReveal delay={0.2}>
          <HomeLiveBuilder />
        </ScrollReveal>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-[var(--bg-subtle)] py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-5">
          <ScrollReveal>
            <div className="text-center mb-14">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Everything you need, nothing you don't</h2>
              <p className="text-[var(--fg-muted)] max-w-lg mx-auto">A complete AI resume workflow — from raw career data to a polished, downloadable PDF.</p>
            </div>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <ScrollReveal key={f.title} delay={i * 0.08}>
                <div className="rounded-2xl border border-[var(--border)] p-6 h-full hover:border-[var(--accent)]/40 hover:shadow-lg transition-all">
                  <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                    <f.Icon size={20} className="text-[var(--accent)]" strokeWidth={1.75} />
                  </div>
                  <h3 className="font-bold mb-1.5">{f.title}</h3>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{f.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Resume Analyzer Section */}
      <section className="max-w-6xl mx-auto px-5 py-20 sm:py-28">
        <ScrollReveal>
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-4 py-1.5 text-xs font-semibold text-[var(--fg-muted)] mb-4">
              <Zap size={13} className="text-[var(--accent)]" />
              Smart Analysis
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3">Know exactly what employers see</h2>
            <p className="text-[var(--fg-muted)] max-w-lg mx-auto">Our analyzer gives you real-time feedback on what makes your resume stand out — and what needs fixing.</p>
          </div>
        </ScrollReveal>

        <div className="grid sm:grid-cols-3 gap-6">
          {ANALYSIS_ITEMS.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.label} delay={i * 0.1}>
                <div className="rounded-2xl border border-[var(--border)] p-7 h-full hover:shadow-lg hover:border-[var(--accent)]/40 transition-all">
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center ${item.color}`}>
                      <Icon size={22} />
                    </div>
                    <h3 className="font-bold text-lg">{item.label}</h3>
                  </div>
                  <ul className="space-y-3">
                    {item.items.map((text) => (
                      <li key={text} className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 shrink-0" />
                        <span className="text-sm text-[var(--fg-muted)]">{text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <ScrollReveal delay={0.4}>
          <div className="mt-12 p-8 rounded-2xl border border-[var(--border)] bg-gradient-to-r from-[var(--accent)]/5 to-transparent">
            <div className="grid sm:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-xl sm:text-2xl font-extrabold mb-3">Get actionable insights instantly</h3>
                <p className="text-[var(--fg-muted)] mb-6 leading-relaxed">Every suggestion is backed by real ATS data. See exactly which keywords matter, how to structure your achievements, and what format parsers love.</p>
                <Link
                  href={ctaHref}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent)] text-white font-semibold px-6 py-3 text-sm hover:bg-[var(--accent-hover)] transition-colors"
                >
                  Try the analyzer <ArrowRight size={16} />
                </Link>
              </div>
              <div className="bg-white text-black rounded-lg p-6 border border-[var(--border)]">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[var(--fg-muted)]">RESUME SCORE</span>
                    <span className="text-sm font-bold text-green-600">78/100</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-200 overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-[var(--accent)] to-blue-500 rounded-full" />
                  </div>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="text-green-500 mt-0.5 shrink-0" />
                    <span><strong>Strong:</strong> Quantified achievements</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={14} className="text-yellow-500 mt-0.5 shrink-0" />
                    <span><strong>Improve:</strong> Add more metrics to skills</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <TrendingUp size={14} className="text-blue-500 mt-0.5 shrink-0" />
                    <span><strong>Tip:</strong> Include industry keywords</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
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
                <div className="rounded-xl border border-[var(--border)] p-6 h-full hover:border-[var(--accent)]/40 hover:shadow-lg transition-all">
                  <div className="text-5xl font-extrabold text-[var(--accent)]/20 mb-3">{s.n}</div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
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

      <section className="max-w-4xl mx-auto px-5 py-20 sm:py-28">
        <ScrollReveal>
          <div className="rounded-3xl bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white px-8 py-16 sm:py-20 shadow-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4 text-center">Ready to build your resume?</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto text-center">Get your first resume generated in under two minutes — free credits included.</p>
            <div className="flex justify-center">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-lg bg-white text-[var(--accent)] font-bold px-8 py-4 text-base hover:shadow-lg transition-all transform hover:scale-105"
              >
                {ctaLabel} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <Footer />
    </div>
  );
}