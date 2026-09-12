import { getAllPublishedArticles } from '@/lib/articles';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5 minutes

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
  const allArticles = await getAllPublishedArticles();

  // Google News guidelines strictly require articles published within the last 48 hours
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  
  let newsArticles = allArticles.filter((a) => {
    const pubDate = new Date(a.publishedAt);
    return pubDate >= cutoff;
  });

  // Fallback: If in dev or baseline where all mocks are older than 48h, include the 10 most recent
  if (newsArticles.length === 0) {
    newsArticles = allArticles.slice(0, 10);
  }

  const xmlItems = newsArticles
    .map((article) => {
      const url = `${SITE_URL}/${article.category.slug}/${article.slug}`;
      const pubDateIso = new Date(article.publishedAt).toISOString();
      const title = escapeXml(article.title);

      return `  <url>
    <loc>${url}</loc>
    <news:news>
      <news:publication>
        <news:name>THE BRIEF</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${pubDateIso}</news:publication_date>
      <news:title>${title}</news:title>
    </news:news>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${xmlItems}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
