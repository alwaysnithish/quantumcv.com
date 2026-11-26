import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import ToolRunner from '@/components/tool-runner';
import { TOOLS, TOOL_BY_SLUG, toolUrl } from '@/lib/tools-config';
import { SITE_URL } from '@/lib/credit-config';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return TOOLS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) return {};
  const url = toolUrl(tool.slug);
  return {
    title: tool.metaTitle,
    description: tool.metaDescription,
    keywords: tool.keywords,
    alternates: { canonical: url },
    openGraph: { type: 'website', url, siteName: 'QuantumCV', title: tool.metaTitle, description: tool.metaDescription },
    twitter: { card: 'summary_large_image', title: tool.metaTitle, description: tool.metaDescription },
  };
}

export default async function ToolPage({ params }: Props) {
  const { slug } = await params;
  const tool = TOOL_BY_SLUG[slug];
  if (!tool) notFound();

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: tool.h1,
      url: toolUrl(tool.slug),
      description: tool.metaDescription,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'QuantumCV', url: SITE_URL },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: tool.faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Free AI Tools', item: `${SITE_URL}/tools` },
        { '@type': 'ListItem', position: 3, name: tool.h1, item: toolUrl(tool.slug) },
      ],
    },
  ];

  const others = TOOLS.filter((t) => t.slug !== tool.slug);

  return (
    <div className="min-h-screen text-[var(--fg)]">
      <Nav />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="mb-4 text-xs text-[var(--fg-muted)]">
          <Link href="/" className="hover:underline">Home</Link> / <Link href="/tools" className="hover:underline">Free AI Tools</Link> / {tool.navTitle}
        </nav>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{tool.h1}</h1>
        <p className="mt-4 max-w-3xl text-[var(--fg-muted)] leading-relaxed">{tool.intro}</p>

        <div className="mt-8"><ToolRunner tool={tool} /></div>

        <section className="mt-14 grid gap-4 sm:grid-cols-3" aria-label="How it works">
          {tool.howItWorks.map((s, i) => (
            <div key={i} className="glass p-5">
              <div className="mb-2 text-xs font-extrabold text-[var(--accent)]">STEP {i + 1}</div>
              <p className="text-sm leading-relaxed">{s}</p>
            </div>
          ))}
        </section>

        <section className="glass mt-12 p-6 sm:p-8">
          <h2 className="text-xl font-extrabold">Turn this into a full, ATS-ready resume</h2>
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            New accounts get 10 free credits — enough for 2 full AI resumes. ATS score checks and manual edits are always free.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/builder" className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm font-bold text-white hover:bg-[var(--accent-hover)]">Open the resume builder</Link>
            <Link href="/resumeanalyser" className="rounded-full border border-[var(--border)] px-5 py-2.5 text-sm font-bold hover:bg-[var(--bg-subtle)]">Free ATS score check</Link>
          </div>
        </section>

        <section className="mt-14" aria-label="Frequently asked questions">
          <h2 className="text-2xl font-extrabold">Frequently asked questions</h2>
          <div className="mt-6 divide-y divide-[var(--border)]">
            {tool.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="font-bold">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">{f.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12" aria-label="More free tools">
          <h2 className="text-lg font-extrabold">More free resume tools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {others.map((t) => (
              <Link key={t.slug} href={`/tools/${t.slug}`} className="glass p-4 text-sm font-semibold hover:border-[var(--accent)]">{t.h1}</Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
