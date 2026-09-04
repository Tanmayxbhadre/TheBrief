import { revalidatePath } from 'next/cache';

/**
 * Revalidates public pages after news collection, publishing, or daily briefing updates
 */
export function revalidateNewsCache(categorySlug?: string, articleSlug?: string) {
  try {
    // 1. Home page
    revalidatePath('/');

    // 2. Category page if applicable
    if (categorySlug) {
      revalidatePath(`/${categorySlug}`);
    }

    // 3. Article page if applicable
    if (categorySlug && articleSlug) {
      revalidatePath(`/${categorySlug}/${articleSlug}`);
    }

    // 4. Flagship products
    revalidatePath('/daily-news');
    revalidatePath('/search');
    revalidatePath('/rss.xml');
  } catch (err) {
    console.warn('[CACHE-REVALIDATE] Revalidation call skipped outside request context:', err);
  }
}
