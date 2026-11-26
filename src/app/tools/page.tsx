import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { TOOLS } from '@/lib/tools-config';
import { SITE_URL } from '@/lib/credit-config';

export const metadata: Metadata = {
  title: 'Free AI Resume Tools for Job Seekers',
  description: 'Free AI resume tools: bullet point generator, ATS keyword extractor, resume summary generator and cover letter generator. No signup needed.',
  alternates: { canonical: `${SITE_URL}/tools` },
};

export default function ToolsIndex() {
  return (
    <div className="min-h-screen text-[var(--fg)]">
      <Nav />
      <main className="mx-auto max-w-5xl px-5 py-14">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Free AI resume tools</h1>
        <p className="mt-4 max-w-2xl text-[var(--fg-muted)]">Four quick tools for freshers and job seekers. Free previews, no card, and one click to carry the result into your full resume.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <Link key={t.slug} href={`/tools/${t.slug}`} className="glass block p-6 transition-transform hover:-translate-y-0.5">
              <h2 className="text-lg font-extrabold">{t.h1}</h2>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{t.metaDescription}</p>
              <span className="mt-4 inline-block text-sm font-bold text-[var(--accent)]">Open tool →</span>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
