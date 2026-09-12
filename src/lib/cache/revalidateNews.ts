import { revalidatePath, revalidateTag } from 'next/cache';
import { submitToIndexNow, pingGoogleSitemap } from '../seo/indexNow';

interface RevalidateOptions {
  categorySlug?: string | null;
  slug?: string | null;
}

const ALL_CATEGORY_SLUGS = [
  'technology',
  'india',
  'world',
  'ai',
  'business',
  'finance',
  'science',
  'sports',
  'startups',
  'gaming',
  'entertainment',
];

/**
 * Centralized cache revalidation service for TheBrief news publishing pipeline.
 * Ensures immediate synchronization across Homepage, all Category Feeds, RSS,
 * Sitemaps, and Search Engines (IndexNow + Google).
 */
export async function revalidateNewsPublication(options: RevalidateOptions = {}) {
  try {
    // 1. Revalidate Core Public Feeds & Homepage
    revalidatePath('/');
    revalidatePath('/daily-news');
    revalidatePath('/search');
    revalidatePath('/rss.xml');
    revalidatePath('/sitemap.xml');
    revalidatePath('/sitemap-news.xml');

    // 2. Revalidate ALL Category Pages so new articles appear instantly in their sections
    for (const catSlug of ALL_CATEGORY_SLUGS) {
      revalidatePath(`/${catSlug}`);
    }

    if (options.categorySlug && !ALL_CATEGORY_SLUGS.includes(options.categorySlug)) {
      revalidatePath(`/${options.categorySlug}`);
    }

    // 3. Revalidate Specific Article Route
    if (options.categorySlug && options.slug) {
      revalidatePath(`/${options.categorySlug}/${options.slug}`);
    }

    // 4. Invalidate tagged Next.js cache segments
    try {
      revalidateTag('news');
      revalidateTag('homepage');
      revalidateTag('articles');
      revalidateTag('categories');
      revalidateTag('breaking');
    } catch {
      // Tags fallback
    }

    console.log(
      `[CacheRevalidation] Successfully revalidated feeds for category=${options.categorySlug || 'all'}, slug=${options.slug || 'all'}`
    );

    // 5. Asynchronously trigger Search Engine Indexing (IndexNow + Google Ping)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
    const urlsToIndex = [`${siteUrl}/`];

    if (options.categorySlug) {
      urlsToIndex.push(`${siteUrl}/${options.categorySlug}`);
    }
    if (options.categorySlug && options.slug) {
      urlsToIndex.push(`${siteUrl}/${options.categorySlug}/${options.slug}`);
    }

    // Run in background without blocking response
    Promise.all([
      submitToIndexNow(urlsToIndex),
      pingGoogleSitemap(),
    ]).catch((err) => {
      console.warn('[CacheRevalidation] Background search indexing ping error:', err);
    });

  } catch (error) {
    console.warn('[CacheRevalidation] Warning during cache revalidation:', error);
  }
}
