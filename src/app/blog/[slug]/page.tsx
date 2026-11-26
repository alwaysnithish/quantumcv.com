import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Nav from '@/components/nav';
import Footer from '@/components/footer';
import PostBody from '@/components/blog/post-body';
import {
  AUTHOR,
  SITE_URL,
  formatDate,
  getAllPosts,
  getPost,
  getRelated,
  readingMinutes,
  slugify,
} from '@/lib/blog';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: post.seoTitle,
    description: post.description,
    keywords: post.keywords,
    authors: [{ name: AUTHOR.name }],
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      modifiedTime: post.updated ?? post.date,
      authors: [AUTHOR.name],
      images: [{ url: post.image, width: 1200, height: 630, alt: post.imageAlt }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: [post.image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const related = getRelated(post, 3);
  const toc = post.blocks
    .filter((b): b is { type: 'h2'; text: string } => b.type === 'h2')
    .map((b) => ({ text: b.text, id: slugify(b.text) }));
  const url = `${SITE_URL}/blog/${post.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.description,
      image: `${SITE_URL}${post.image}`,
      datePublished: post.date,
      dateModified: post.updated ?? post.date,
      mainEntityOfPage: url,
      author: { '@type': 'Organization', name: AUTHOR.name, url: AUTHOR.url },
      publisher: {
        '@type': 'Organization',
        name: 'QuantumCV',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
      },
      keywords: post.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
    ...(post.faqs.length
      ? [
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: post.faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          },
        ]
      : []),
  ];

  return (
    <>
      <Nav />
      <main>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
        />

        <article className="max-w-5xl mx-auto px-5 pt-10 pb-16">
          <nav aria-label="Breadcrumb" className="text-sm text-[var(--fg-muted)]">
            <Link href="/" className="hover:text-[var(--fg)]">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/blog" className="hover:text-[var(--fg)]">Blog</Link>
          </nav>

          <header className="mt-6 max-w-3xl">
            <div className="text-sm font-semibold text-[var(--accent)]">{post.category}</div>
            <h1 className="mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">{post.title}</h1>
            <p className="mt-5 text-lg leading-8 text-[var(--fg-muted)]">{post.excerpt}</p>
            <div className="mt-5 text-sm text-[var(--fg-muted)]">
              By {AUTHOR.name} · {formatDate(post.date)}
              {post.updated && post.updated !== post.date ? ` · Updated ${formatDate(post.updated)}` : ''} ·{' '}
              {readingMinutes(post)} min read
            </div>
          </header>

          <div className="mt-8 aspect-[1200/630] w-full overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)]">
            <img
              src={post.image}
              alt={post.imageAlt}
              width={1200}
              height={630}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-12 grid lg:grid-cols-[minmax(0,42rem)_15rem] gap-14 justify-between">
            <div>
              <PostBody blocks={post.blocks} />

              {post.faqs.length > 0 && (
                <section aria-labelledby="faq-heading" className="mt-16">
                  <h2 id="faq-heading" className="text-2xl font-extrabold tracking-tight">
                    Frequently asked questions
                  </h2>
                  <div className="mt-5 divide-y divide-[var(--border)] border-y border-[var(--border)]">
                    {post.faqs.map((f) => (
                      <details key={f.q} className="group py-4">
                        <summary className="cursor-pointer list-none font-semibold leading-7 flex justify-between gap-4">
                          {f.q}
                          <span aria-hidden className="text-[var(--accent)] group-open:rotate-45 transition-transform">
                            +
                          </span>
                        </summary>
                        <p className="mt-2 leading-8 text-[var(--fg-muted)]">{f.a}</p>
                      </details>
                    ))}
                  </div>
                </section>
              )}

              <section className="mt-16 rounded-2xl border border-[var(--border)] bg-[var(--bg-subtle)] p-7">
                <h2 className="text-xl font-extrabold tracking-tight">Put this into practice</h2>
                <p className="mt-2 leading-7 text-[var(--fg-muted)]">
                  Build a first draft from your own notes, then check it with the free ATS score before you apply.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href="/login"
                    className="rounded-full bg-[var(--accent)] text-white text-sm font-semibold px-5 py-2.5 hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Start building free
                  </Link>
                  <Link
                    href="/resumeanalyser"
                    className="rounded-full border border-[var(--border)] text-sm font-semibold px-5 py-2.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
                  >
                    Try the resume analyser
                  </Link>
                </div>
              </section>
            </div>

            <aside className="hidden lg:block">
              <div className="sticky top-24">
                <nav aria-label="On this page">
                  <div className="text-sm font-bold mb-3">On this page</div>
                  <ul className="space-y-2.5 border-l border-[var(--border)] text-sm">
                    {toc.map((t) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className="block pl-4 -ml-px border-l border-transparent leading-6 text-[var(--fg-muted)] hover:text-[var(--fg)] hover:border-[var(--accent)]"
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          </div>
        </article>

        {related.length > 0 && (
          <section className="border-t border-[var(--border)]">
            <div className="max-w-6xl mx-auto px-5 py-14">
              <div className="flex items-baseline justify-between gap-4">
                <h2 className="text-2xl font-extrabold tracking-tight">Keep reading</h2>
                <Link href="/blog" className="text-sm font-semibold text-[var(--accent)] hover:underline">
                  All articles
                </Link>
              </div>
              <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {related.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                  >
                    <div className="aspect-[1200/630] w-full overflow-hidden bg-[var(--bg-subtle)]">
                      <img
                        src={p.image}
                        alt={p.imageAlt}
                        width={1200}
                        height={630}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="p-5">
                      <div className="text-sm font-semibold text-[var(--accent)]">{p.category}</div>
                      <h3 className="mt-1.5 font-bold tracking-tight leading-snug">{p.title}</h3>
                      <div className="mt-3 text-sm text-[var(--fg-muted)]">{readingMinutes(p)} min read</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
