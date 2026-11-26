import type { MetadataRoute } from 'next';

const SITE_URL = 'https://quantumcv.app';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/builder', '/billing', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
