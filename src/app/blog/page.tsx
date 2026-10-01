import type { Metadata } from 'next';
import Link from 'next/link';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import { getAllPosts, readingMinutes, formatDate, SITE_URL } from '@/lib/blog';
import type { Post } from '@/lib/blog-types';

export const revalidate = 3600;

const DESC =
  'Practical resume guides for freshers and students: writing a resume with no experience, ATS scores, bullet points, formats for India, and using AI well.';

export const metadata: Metadata = {
  title: 'Resume Guides for Freshers and Students',
  description: DESC,
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    title: 'Resume Guides for Freshers and Students — QuantumCV',
    description: DESC,
  },
};

function Cover({ post, eager = false }: { post: Post; eager?: boolean }) {
  return (
    <div className="aspect-[1200/630] w-full overflow-hidden bg-[var(--bg-subtle)]">
      <img
        src={post.image}
        alt={post.imageAlt}
        width={1200}
        height={630}
        loading={eager ? 'eager' : 'lazy'}
        className="h-full w-full object-cover"
      />
    </div>
  );
}

function Meta({ post }: { post: Post }) {
  return (
    <div className="text-sm text-[var(--fg-muted)]">
      {formatDate(post.date)} · {readingMinutes(post)} min read
    </div>
  );
}

export default function BlogIndex() {
  const posts = getAllPosts();
  const [featured, ...rest] = posts;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'QuantumCV Resume Blog',
    url: `${SITE_URL}/blog`,
    description: DESC,
    publisher: { '@type': 'Organization', name: 'QuantumCV', url: SITE_URL },
    blogPost: posts.map((p) => ({
      '@type': 'BlogPosting',
      headline: p.title,
      url: `${SITE_URL}/blog/${p.slug}`,
      datePublished: p.date,
    })),
  };

  return (
    <>
      <Nav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />

        <section className="max-w-6xl mx-auto px-5 pt-14 pb-10">
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight max-w-3xl leading-[1.1]">
            Resume guides for freshers and students
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--fg-muted)]">
            Plain advice on writing a first resume, getting past applicant tracking systems, and using AI without
            losing your own voice. When you&apos;re ready, the{' '}
            <Link href="/resumeanalyser" className="text-[var(--accent)] underline underline-offset-4">
              free resume analyser
            </Link>{' '}
            will tell you where you stand.
          </p>
        </section>

        {featured && (
          <section className="max-w-6xl mx-auto px-5">
            <Link
              href={`/blog/${featured.slug}`}
              className="group grid md:grid-cols-2 gap-0 overflow-hidden rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
            >
              <Cover post={featured} eager />
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="text-sm font-semibold text-[var(--accent)]">{featured.category}</div>
                <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {featured.title}
                </h2>
                <p className="mt-3 leading-7 text-[var(--fg-muted)]">{featured.excerpt}</p>
                <div className="mt-5">
                  <Meta post={featured} />
                </div>
              </div>
            </Link>
          </section>
        )}

        <section className="max-w-6xl mx-auto px-5 py-12">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
              >
                <Cover post={p} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="text-sm font-semibold text-[var(--accent)]">{p.category}</div>
                  <h2 className="mt-1.5 text-lg font-bold tracking-tight leading-snug">{p.title}</h2>
                  <p className="mt-2 text-[0.95rem] leading-7 text-[var(--fg-muted)]">{p.excerpt}</p>
                  <div className="mt-auto pt-4">
                    <Meta post={p} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-5 pb-20">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-8 sm:p-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight">Ready to build your resume?</h2>
              <p className="mt-2 text-[var(--fg-muted)] max-w-xl leading-7">
                Paste your career details in your own words, pick a target role, and get a first draft with a free ATS
                score.
              </p>
            </div>
            <Link
              href="/login"
              className="shrink-0 self-start sm:self-auto rounded-full bg-[var(--accent)] text-white font-semibold px-6 py-3 hover:bg-[var(--accent-hover)] transition-colors"
            >
              Start building free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
