import type { MetadataRoute } from 'next';

const SITE_URL = 'https://quantumcv.app';

/**
 * Next.js serves this automatically at /sitemap.xml — no need to write or
 * maintain an actual XML file by hand. Only public, indexable marketing
 * pages are listed here. Authenticated app pages (/dashboard, /builder,
 * /billing) and API routes are deliberately excluded — they require login,
 * have no SEO value, and are already blocked in robots.ts.
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
