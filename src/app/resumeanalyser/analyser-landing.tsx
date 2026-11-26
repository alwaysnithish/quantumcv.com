import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileSearch,
  FileUp,
  ScanSearch,
  ShieldAlert,
  Sparkles,
  Target,
} from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { getAllPosts } from '@/lib/blog';

const SITE_URL = 'https://quantumcv.app';

const CHECKS = [
  {
    Icon: ScanSearch,
    title: 'ATS parseability',
    desc: 'Checks whether your text, headings and layout can be read cleanly, and flags formatting risks such as columns, tables or text inside images.',
  },
  {
    Icon: Target,
    title: 'Role keyword match',
    desc: 'Compares your resume with a target role, or a job description you paste in, and lists the keywords you match and the ones you are missing.',
  },
  {
    Icon: FileSearch,
    title: 'Section structure',
    desc: 'Detects Education, Experience, Projects, Skills and other sections, then tells you what to keep, shorten, reorder or strengthen.',
  },
  {
    Icon: Sparkles,
    title: 'Before-and-after rewrites',
    desc: 'Shows weak lines next to stronger versions, with guidance on adding real numbers rather than invented ones.',
  },
  {
    Icon: ShieldAlert,
    title: 'Fixes ranked by impact',
    desc: 'A prioritised list of what to change first, with the problem, why it matters, where it is on the page and how to fix it.',
  },
  {
    Icon: CheckCircle2,
    title: "A recruiter's-eye view",
    desc: 'First impression, strengths, concerns, and the questions a recruiter is likely to ask you in an interview.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Create a free account',
    desc: 'The analysis is available to signed-in accounts. Signing up takes a minute.',
  },
  {
    n: '02',
    title: 'Add your resume',
    desc: 'Pick a resume saved in your dashboard, upload a PDF, Word or text file (up to 6 MB), or paste the text. Add a target role and, if you have one, the job description.',
  },
  {
    n: '03',
    title: 'Read your report',
    desc: 'Get an overall score, a ranked list of fixes, keyword gaps and rewrites, then update your resume and run it again.',
  },
];

const FAQS = [
  {
    q: 'Why do I need an account to analyse my resume?',
    a: 'The analysis uses AI on our servers, so it is limited to signed-in accounts. Signing in also lets you pick any resume you have saved in your dashboard.',
  },
  {
    q: 'What can I upload?',
    a: 'You can upload a PDF, a Word document or a text file of up to 6 MB, paste your resume text, or choose a resume you saved in your QuantumCV dashboard.',
  },
  {
    q: 'Is the score what an employer\'s ATS shows?',
    a: 'No. Every employer\'s system works differently and none of them show applicants a score. The score estimates how well your resume would be read and how strong the content is, so use the findings as a checklist of what to improve.',
  },
  {
    q: 'Do I need a job description?',
    a: 'No, a target role is enough. Adding the job description makes the keyword comparison more specific to the job you are applying for.',
  },
  {
    q: 'Does it work if I have no work experience?',
    a: 'Yes. The analysis takes your career stage into account, so education, projects and activities are assessed as a fresher\'s experience rather than being marked down for missing jobs.',
  },
];

const BADGE = {
  critical: 'bg-red-500/15 text-red-500',
  high: 'bg-amber-500/15 text-amber-500',
  medium: 'bg-blue-500/15 text-blue-500',
  low: 'bg-slate-500/15 text-slate-400',
} as const;

const SAMPLE_FIXES = [
  { p: 'high', label: 'High impact', text: 'Project bullets describe tasks instead of results' },
  { p: 'medium', label: 'Medium', text: 'Keywords from the target role are missing: SQL, Git' },
  { p: 'low', label: 'Low', text: 'Date formats differ between Education and Projects' },
] as const;

export default function AnalyserLanding() {
  const wanted = ['free-ats-resume-score-checker-guide', 'ats-friendly-resume-format', 'resume-bullet-points-for-freshers'];
  const guides = getAllPosts().filter((p) => wanted.includes(p.slug));

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Resume analyser', item: `${SITE_URL}/resumeanalyser` },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <Nav />
      <main>
        {/* Hero */}
        <section className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top,_color-mix(in_srgb,var(--accent)_20%,transparent),transparent_50%)]">
          <div className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs font-bold uppercase tracking-[.12em] text-[var(--fg-muted)]">
                <ScanSearch size={14} className="text-[var(--accent)]" /> Resume analyser
              </div>
              <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-[-.05em] leading-[1]">
                ATS resume score checker for freshers
              </h1>
              <p className="mt-5 max-w-2xl text-base sm:text-lg leading-8 text-[var(--fg-muted)]">
                Upload your resume, add a target role, and get a recruiter-style review: an overall score, keyword gaps,
                and specific fixes you can make before you apply. Built for freshers and students.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--accent)] text-white font-semibold px-6 py-3.5 text-sm hover:bg-[var(--accent-hover)] transition-colors shadow-lg"
                >
                  Sign up to analyse your resume <ArrowRight size={16} />
                </Link>
                <a
                  href="#sample"
                  className="inline-flex items-center justify-center rounded-lg border border-[var(--border)] font-semibold px-6 py-3.5 text-sm hover:bg-[var(--bg-subtle)] transition-colors"
                >
                  See a sample report
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* What it checks */}
        <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">What the analyser checks</h2>
            <p className="mt-3 text-[var(--fg-muted)] leading-7">
              Every finding is based on what is actually in your resume, so you get specific fixes instead of generic tips.
            </p>
          </div>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CHECKS.map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--accent)]/40 hover:shadow-lg transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center mb-4">
                  <c.Icon size={20} className="text-[var(--accent)]" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold mb-1.5">{c.title}</h3>
                <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="bg-[var(--bg-subtle)] py-16 sm:py-24">
          <div className="max-w-6xl mx-auto px-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How it works</h2>
            <div className="mt-10 grid md:grid-cols-3 gap-6">
              {STEPS.map((s) => (
                <div key={s.n} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-6">
                  <div className="text-5xl font-extrabold text-[var(--accent)]/20 mb-3">{s.n}</div>
                  <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-[var(--fg-muted)] leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 flex items-center gap-2 text-sm text-[var(--fg-muted)]">
              <FileUp size={16} className="text-[var(--accent)] shrink-0" />
              Your file is used for this request only and is not saved.
            </p>
          </div>
        </section>

        {/* Sample report */}
        <section id="sample" className="max-w-6xl mx-auto px-5 py-16 sm:py-24 scroll-mt-20">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">What a report looks like</h2>
            <p className="mt-3 text-[var(--fg-muted)] leading-7">
              This is a made-up example to show the layout. Your report is built from your own resume.
            </p>
          </div>
          <div className="mt-10 grid lg:grid-cols-[.8fr_1.2fr] gap-6">
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7 flex flex-col sm:flex-row lg:flex-col items-center gap-6 text-center sm:text-left lg:text-center">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-[10px] border-[var(--accent)] bg-[var(--bg)] shadow-xl shadow-[var(--accent)]/15">
                <div className="text-center">
                  <div className="text-4xl font-extrabold tracking-tight">72</div>
                  <div className="text-[10px] font-bold uppercase tracking-[.14em] text-[var(--fg-muted)]">Overall</div>
                </div>
              </div>
              <div>
                <div className="font-bold">Solid base, needs measurable results</div>
                <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed">
                  Clear structure and readable layout. Project and internship lines should say what changed because of your work.
                </p>
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border)] bg-[var(--card)] p-7">
              <h3 className="font-extrabold">Top fixes</h3>
              <ul className="mt-4 space-y-3">
                {SAMPLE_FIXES.map((f) => (
                  <li key={f.text} className="flex items-start gap-3 text-sm">
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-bold ${BADGE[f.p]}`}>{f.label}</span>
                    <span className="leading-6">{f.text}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--fg-muted)] mb-1.5">
                    <AlertCircle size={13} /> Original
                  </div>
                  <p className="text-sm leading-6 text-[var(--fg-muted)]">Worked on the website for a college event.</p>
                </div>
                <div className="rounded-xl border border-[var(--accent)] p-4">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--accent)] mb-1.5">
                    <CheckCircle2 size={13} /> Improved
                  </div>
                  <p className="text-sm leading-6">
                    Built the registration page for a college fest in HTML, CSS and JavaScript. Add the number of sign-ups
                    only if you have it.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--bg-subtle)] py-16 sm:py-24">
          <div className="max-w-3xl mx-auto px-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">Frequently asked questions</h2>
            <div className="mt-10 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {FAQS.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="cursor-pointer list-none font-semibold flex justify-between gap-4">
                    {f.q}
                    <span aria-hidden className="text-[var(--accent)] group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-[var(--fg-muted)] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related guides */}
        {guides.length > 0 && (
          <section className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Before you run it, read these</h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-5">
              {guides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/blog/${g.slug}`}
                  className="block rounded-2xl border border-[var(--border)] p-6 hover:border-[var(--accent)]/40 hover:shadow-lg transition-all"
                >
                  <div className="text-xs font-semibold text-[var(--accent)] mb-2">{g.category}</div>
                  <h3 className="font-bold leading-snug">{g.title}</h3>
                  <p className="mt-2 text-sm text-[var(--fg-muted)] leading-relaxed">{g.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Final CTA */}
        <section className="max-w-4xl mx-auto px-5 pb-20 sm:pb-28">
          <div className="rounded-3xl bg-gradient-to-r from-[var(--accent)] to-blue-600 text-white px-8 py-14 text-center shadow-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight mb-3">Find out where your resume stands</h2>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Create a free account, upload your resume, and get your report in one sitting.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-[var(--accent)] font-bold px-8 py-4 hover:shadow-lg transition-all"
            >
              Sign up to analyse your resume <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
