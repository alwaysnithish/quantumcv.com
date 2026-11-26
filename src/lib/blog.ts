import type { Post } from './blog-types';
import { post as resumeWithNoExperience } from '@/content/blog/resume-with-no-experience';
import { post as atsScoreGuide } from '@/content/blog/free-ats-resume-score-checker-guide';
import { post as fresherFormatIndia } from '@/content/blog/fresher-resume-format-india';
import { post as aiResumeBuilder } from '@/content/blog/how-to-use-ai-resume-builder';
import { post as bulletPoints } from '@/content/blog/resume-bullet-points-for-freshers';
import { post as atsFormat } from '@/content/blog/ats-friendly-resume-format';
import { post as freeVsPaid } from '@/content/blog/free-vs-paid-resume-builders';

export const SITE_URL = 'https://quantumcv.app';

// Put a real person's name here when you have one. Google and readers both
// trust a named author more than a brand account.
export const AUTHOR = {
  name: 'QuantumCV Team',
  url: `${SITE_URL}/blog`,
};

const ALL_POSTS: Post[] = [
  resumeWithNoExperience,
  atsScoreGuide,
  fresherFormatIndia,
  aiResumeBuilder,
  bulletPoints,
  atsFormat,
  freeVsPaid,
];

function isPublished(p: Post) {
  return new Date(p.date).getTime() <= Date.now();
}

export function getAllPosts(): Post[] {
  return ALL_POSTS.filter(isPublished).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getPost(slug: string): Post | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

export function getRelated(post: Post, limit = 3): Post[] {
  const all = getAllPosts();
  const picked = post.related
    .map((s) => all.find((p) => p.slug === s))
    .filter((p): p is Post => Boolean(p));
  if (picked.length >= limit) return picked.slice(0, limit);
  const extra = all.filter((p) => p.slug !== post.slug && !picked.includes(p));
  return [...picked, ...extra].slice(0, limit);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function readingMinutes(post: Post) {
  const parts: string[] = [];
  for (const b of post.blocks) {
    if ('text' in b) parts.push(b.text);
    if ('items' in b) parts.push(...b.items);
    if (b.type === 'compare') parts.push(b.before, b.after, b.note ?? '');
  }
  for (const f of post.faqs) parts.push(f.q, f.a);
  const words = parts.join(' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Spread these into your existing sitemap so every post is listed. */
export function blogSitemapEntries() {
  const posts = getAllPosts();
  return [
    {
      url: `${SITE_URL}/blog`,
      lastModified: posts[0] ? new Date(posts[0].updated ?? posts[0].date) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    ...posts.map((p) => ({
      url: `${SITE_URL}/blog/${p.slug}`,
      lastModified: new Date(p.updated ?? p.date),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ];
}
