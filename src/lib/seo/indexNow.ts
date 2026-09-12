/**
 * IndexNow & Search Engine Web Rank Crawl Notification Service
 * Supported by Bing, Microsoft, Yandex, Naver, and Seznam.
 * Allows near-instant discovery of newly published articles.
 */

export const INDEXNOW_KEY = process.env.INDEXNOW_KEY || 'thebrief-indexnow-key-2026';

export async function submitToIndexNow(urls: string[]): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
  
  if (!urls.length) return false;

  try {
    const host = new URL(siteUrl).hostname;
    const keyLocation = `${siteUrl}/${INDEXNOW_KEY}.txt`;

    const payload = {
      host,
      key: INDEXNOW_KEY,
      keyLocation,
      urlList: urls.map((u) => (u.startsWith('http') ? u : `${siteUrl}${u}`)),
    };

    const res = await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok || res.status === 202) {
      console.log(`[IndexNow] Successfully submitted ${urls.length} URLs to IndexNow.`);
      return true;
    } else {
      console.warn(`[IndexNow] Submission returned status ${res.status}: ${await res.text().catch(() => '')}`);
      return false;
    }
  } catch (err) {
    console.warn('[IndexNow] Notification skipped or network error:', err);
    return false;
  }
}

export async function pingGoogleSitemap(): Promise<void> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
  const sitemaps = [
    `${siteUrl}/sitemap.xml`,
    `${siteUrl}/sitemap-news.xml`,
  ];

  for (const sm of sitemaps) {
    try {
      await fetch(`https://www.google.com/ping?sitemap=${encodeURIComponent(sm)}`, {
        method: 'GET',
        headers: { 'User-Agent': 'TheBrief-Publisher/1.0' },
      });
      console.log(`[Google-Ping] Pinged sitemap: ${sm}`);
    } catch {
      // Best-effort ping
    }
  }
}
