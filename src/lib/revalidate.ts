import { revalidateNewsPublication } from './cache/revalidateNews';

/**
 * Revalidates public pages after news collection, publishing, or daily briefing updates
 */
export function revalidateNewsCache(categorySlug?: string, articleSlug?: string) {
  revalidateNewsPublication({
    categorySlug,
    slug: articleSlug,
  }).catch((err) => {
    console.warn('[CACHE-REVALIDATE] Revalidation error:', err);
  });
}
