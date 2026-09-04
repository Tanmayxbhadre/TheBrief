import { revalidatePath, revalidateTag } from 'next/cache';

interface RevalidateOptions {
  categorySlug?: string | null;
  slug?: string | null;
}

/**
 * Centralized cache revalidation service for TheBrief news publishing pipeline.
 * Ensures consistent invalidation across Homepage, Category Feeds, RSS, Sitemap, and Articles.
 */
export async function revalidateNewsPublication(options: RevalidateOptions = {}) {
  try {
    // 1. Revalidate Core Public Feeds & Homepage
    revalidatePath('/');
    revalidatePath('/daily-news');
    revalidatePath('/search');
    revalidatePath('/rss.xml');
    revalidatePath('/sitemap.xml');

    // 2. Revalidate Specific Category Page
    if (options.categorySlug) {
      revalidatePath(`/${options.categorySlug}`);
    }

    // 3. Revalidate Specific Article Route
    if (options.categorySlug && options.slug) {
      revalidatePath(`/${options.categorySlug}/${options.slug}`);
    }

    // 4. Invalidate tagged cache segments
    try {
      revalidateTag('news', 'max');
      revalidateTag('homepage', 'max');
      revalidateTag('articles', 'max');
    } catch {
      // Tags may not be configured in all environments; safe fallback
    }

    console.log(
      `[CacheRevalidation] Successfully revalidated feeds for category=${options.categorySlug || 'all'}, slug=${options.slug || 'all'}`
    );
  } catch (error) {
    console.warn('[CacheRevalidation] Warning during cache revalidation:', error);
  }
}
