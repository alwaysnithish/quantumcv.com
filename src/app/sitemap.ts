import type { MetadataRoute } from 'next';
import { blogSitemapEntries } from '@/lib/blog';

const SITE_URL = 'https://quantumcv.app';

/**
 * Next.js serves this automatically at /sitemap.xml — no need to write or
 * maintain an actual XML file by hand. Only public, indexable marketing
 * pages are listed here. Authenticated app pages (/dashboard, /builder,
 * /billing) and API routes are deliberately excluded — they require login,
 * have no SEO value, and are already blocked in robots.ts.
 *
 * Blog pages come from blogSitemapEntries() in src/lib/blog.ts, so every new
 * post you add there shows up here automatically (and posts dated in the
 * future stay out until their publish date).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      // The free ATS tool is one of your best entry points for search,
      // so it ranks well above the legal pages.
      url: `${SITE_URL}/resumeanalyser`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    // /blog and /blog/[slug] pages
    ...blogSitemapEntries(),
    {
      url: `${SITE_URL}/login`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
