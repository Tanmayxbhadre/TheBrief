import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
      {
        userAgent: ['Googlebot', 'Bingbot', 'Googlebot-News'],
        allow: '/',
        disallow: ['/admin/', '/api/admin/', '/api/cron/'],
      },
    ],
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/sitemap-news.xml`,
    ],
    host: SITE_URL,
  };
}
