import Link from 'next/link';
import { ArrowUpRight, FileText, ShieldCheck } from 'lucide-react';
import Nav from '@/components/nav';
import Footer from '@/components/footer';

type LegalSection = {
  title: string;
  content: React.ReactNode;
};

export default function LegalPage({
  eyebrow,
  title,
  description,
  sections,
}: {
  eyebrow: string;
  title: string;
  description: string;
  sections: LegalSection[];
}) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <Nav />
      <main>
        <section className="border-b border-[var(--border)] bg-[radial-gradient(circle_at_top_left,_color-mix(in_srgb,var(--accent)_14%,transparent),transparent_42%)]">
          <div className="max-w-6xl mx-auto px-5 py-16 sm:py-24">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)]/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                <ShieldCheck size={14} className="text-[var(--accent)]" /> {eyebrow}
              </div>
              <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold tracking-[-0.055em] leading-[0.98]">{title}</h1>
              <p className="mt-5 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--fg-muted)]">{description}</p>
              <p className="mt-7 text-sm font-medium text-[var(--fg-muted)]">Last updated · July 2026</p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 py-12 sm:py-20 lg:grid lg:grid-cols-[12rem_minmax(0,44rem)] lg:gap-20">
          <aside className="hidden lg:block">
            <div className="sticky top-24 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--fg-muted)]"><FileText size={14} /> On this page</div>
              <ol className="space-y-2 text-sm text-[var(--fg-muted)]">
                {sections.map((section, index) => (
                  <li key={section.title}><a href={`#section-${index + 1}`} className="hover:text-[var(--accent)] transition-colors">{String(index + 1).padStart(2, '0')}. {section.title}</a></li>
                ))}
              </ol>
            </div>
          </aside>
          <article className="space-y-10">
            {sections.map((section, index) => (
              <section key={section.title} id={`section-${index + 1}`} className="scroll-mt-24">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent)]/10 text-xs font-extrabold text-[var(--accent)]">{String(index + 1).padStart(2, '0')}</span>
                  <h2 className="text-xl font-bold tracking-tight">{section.title}</h2>
                </div>
                <div className="pl-10 text-sm leading-7 text-[var(--fg-muted)] [&_a]:font-medium [&_a]:text-[var(--accent)] [&_a]:underline-offset-4 hover:[&_a]:underline [&_ul]:mt-3 [&_ul]:space-y-2 [&_ul]:pl-5 [&_ul]:list-disc">
                  {section.content}
                </div>
              </section>
            ))}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-5 sm:flex sm:items-center sm:justify-between">
              <div><p className="font-bold">Questions about this document?</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Our support team is happy to help.</p></div>
              <Link href="/contact" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] sm:mt-0">Contact us <ArrowUpRight size={15} /></Link>
            </div>
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
