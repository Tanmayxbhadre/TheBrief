import { prisma } from '../db';
import { Article, BreakingNewsItem } from '../types';
import { draftToArticle } from '../articles';
import { articles as mockArticles, getBreakingNews as getMockBreakingNews } from '../mock-data';

export interface HomepageData {
  breakingItem: BreakingNewsItem | null;
  featured: Article;
  secondary: Article[];
  latestArticles: Article[];
  trendingArticles: Article[];
  categoryArticles: Record<string, Article[]>;
  latestPublishedAt: string | null;
  latestArticleId: string | null;
}

/**
 * Deterministic scoring algorithm for selecting the Hero and Trending stories
 */
function calculateStoryPriority(
  article: Article,
  rawInternalNotes?: string | null
): { priorityScore: number; trendingScore: number } {
  let notes: Record<string, unknown> = {};
  try {
    if (rawInternalNotes) notes = JSON.parse(rawInternalNotes);
  } catch {}

  const importance = Number(notes.importanceScore || notes.qualityScore || 60);
  const trendingBase = Number(notes.trendingScore || notes.confidenceScore || 50);

  const pubTime = new Date(article.publishedAt).getTime();
  const ageHours = Math.max(0, (Date.now() - pubTime) / (1000 * 60 * 60));

  // Freshness component (favor stories within last 24-48 hours)
  let freshnessBonus = 0;
  if (ageHours <= 6) freshnessBonus = 30;
  else if (ageHours <= 18) freshnessBonus = 20;
  else if (ageHours <= 36) freshnessBonus = 10;
  else if (ageHours <= 72) freshnessBonus = 5;

  const priorityScore =
    (article.featured ? 40 : 0) +
    (article.breaking ? 30 : 0) +
    importance * 0.35 +
    trendingBase * 0.2 +
    freshnessBonus;

  const trendingScore = trendingBase * 0.6 + freshnessBonus * 0.4;

  return { priorityScore, trendingScore };
}

/**
 * Centralized Homepage Data Fetcher:
 * Queries all PUBLISHED database articles, applies deterministic intelligence ranking,
 * and provides fallback mock content only when database content is not yet available.
 */
export async function getHomepageData(): Promise<HomepageData> {
  try {
    // 1. Fetch all PUBLISHED articles from Database
    const dbDrafts = await prisma.articleDraft.findMany({
      where: {
        status: 'PUBLISHED',
      },
      include: {
        category: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: 50,
    });

    const dbArticles = dbDrafts.map(draftToArticle);

    // If DB is completely empty, use mockArticles as baseline fallback
    const hasDbArticles = dbArticles.length > 0;
    const allAvailable = hasDbArticles ? dbArticles : mockArticles;

    // Track metadata for live version check
    const latestPublishedAt = hasDbArticles && dbArticles[0].publishedAt
      ? dbArticles[0].publishedAt
      : null;
    const latestArticleId = hasDbArticles ? dbArticles[0].id : null;

    // 2. Dynamic Breaking News Bar
    let breakingItem: BreakingNewsItem | null = null;
    const breakingCandidate = dbDrafts.find((d) => d.breaking);

    if (breakingCandidate) {
      // Check freshness (only within last 48 hours)
      const ageHours =
        (Date.now() - new Date(breakingCandidate.publishedAt || breakingCandidate.createdAt).getTime()) /
        (1000 * 60 * 60);

      if (ageHours <= 48) {
        breakingItem = {
          id: breakingCandidate.id,
          headline: breakingCandidate.title,
          url: `/${breakingCandidate.category?.slug || 'news'}/${breakingCandidate.slug}`,
          time: breakingCandidate.publishedAt
            ? new Date(breakingCandidate.publishedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Live',
        };
      }
    } else if (!hasDbArticles) {
      // If DB has 0 items, fallback to mock breaking news
      breakingItem = getMockBreakingNews() || null;
    }

    // 3. Score all available articles
    const scoredArticles = allAvailable.map((art) => {
      const draftRecord = dbDrafts.find((d) => d.id === art.id);
      const { priorityScore, trendingScore } = calculateStoryPriority(
        art,
        draftRecord?.internalNotes
      );
      return {
        article: art,
        priorityScore,
        trendingScore,
      };
    });

    // ── Deduplication Allocator ─────────────────────────────────────────────
    // Tracks every identity token that has already been reserved.
    // Identity strength: Article ID > StoryCluster ID > canonical URL > slug
    const usedIds = new Set<string>();

    /** Returns true and marks the article reserved if it has not been seen before. */
    function reserve(article: Article): boolean {
      // Build identity tokens from strongest to weakest.
      // Article has no `url` field; canonical path = category/slug.
      const tokens: string[] = [article.id];
      const storyClusterId = (article as { storyClusterId?: string }).storyClusterId;
      if (storyClusterId) tokens.push(`cluster:${storyClusterId}`);
      tokens.push(`path:${article.category.slug}/${article.slug}`);
      tokens.push(`slug:${article.slug}`);

      // If ANY token is already used → this is a duplicate
      for (const t of tokens) {
        if (usedIds.has(t)) return false;
      }

      // Mark all tokens as used
      for (const t of tokens) usedIds.add(t);
      return true;
    }

    /** Pick up to `limit` articles from `pool`, reserving each one. */
    function allocate(pool: Article[], limit: number): Article[] {
      const result: Article[] = [];
      for (const article of pool) {
        if (result.length >= limit) break;
        if (reserve(article)) result.push(article);
      }
      return result;
    }

    // ── Allocation order: Breaking → Hero → Secondary → Latest → Trending → Categories
    // (Breaking news bar was already selected above; reserve it so it doesn't
    //  appear again in other sections.)
    if (breakingItem) {
      const breakingArticle = allAvailable.find((a) => a.id === breakingItem!.id);
      if (breakingArticle) reserve(breakingArticle);
    }

    // 4. Hero Story (highest priority-score)
    const rankedForHero = [...scoredArticles].sort((a, b) => b.priorityScore - a.priorityScore);
    const heroPool = rankedForHero.map((s) => s.article);
    const [featured] = allocate(heroPool, 1);
    const effectiveFeatured = featured || allAvailable[0];
    // Reserve fallback if allocate returned nothing (empty DB → mock)
    if (!featured && effectiveFeatured) reserve(effectiveFeatured);

    // 5. Secondary (next 3 by priority, not already reserved)
    const secondary = allocate(heroPool, 3);

    // 6. Latest News (chronological, not already reserved)
    const chronological = [...allAvailable].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const latestArticles = allocate(chronological, 8);

    // 7. Trending News (by trending score, not already reserved)
    const trendingPool = [...scoredArticles]
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .map((s) => s.article);
    const trendingArticles = allocate(trendingPool, 5);

    // 8. Category Sections (per-category, not already reserved)
    const targetCategories = [
      'technology',
      'india',
      'world',
      'ai',
      'business',
      'science',
      'startups',
      'gaming',
      'entertainment',
    ];

    const categoryArticles: Record<string, Article[]> = {};

    for (const catSlug of targetCategories) {
      const matchedDb = dbArticles.filter(
        (a) => a.category.slug.toLowerCase() === catSlug.toLowerCase()
      );

      if (matchedDb.length > 0) {
        // Allocate from real DB articles for this category (deduplication-aware)
        categoryArticles[catSlug] = allocate(matchedDb, 4);
      } else {
        // Fallback to mock category items; mock articles don't participate in
        // global dedup so we slice without reserving (they're static placeholders)
        const matchedMock = mockArticles.filter(
          (a) => a.category.slug.toLowerCase() === catSlug.toLowerCase()
        );
        categoryArticles[catSlug] = matchedMock.slice(0, 4);
      }
    }

    return {
      breakingItem,
      featured: effectiveFeatured,
      secondary,
      latestArticles,
      trendingArticles,
      categoryArticles,
      latestPublishedAt,
      latestArticleId,
    };
  } catch (error) {
    console.error('[HomepageData] Error loading published stories from database:', error);

    // Safe fallback to baseline mock data
    const featured = mockArticles[0];
    const secondary = mockArticles.slice(1, 4);
    const latestArticles = mockArticles.slice(0, 8);
    const trendingArticles = mockArticles.slice(0, 5);
    const breakingItem = getMockBreakingNews() || null;

    return {
      breakingItem,
      featured,
      secondary,
      latestArticles,
      trendingArticles,
      categoryArticles: {},
      latestPublishedAt: null,
      latestArticleId: null,
    };
  }
}
