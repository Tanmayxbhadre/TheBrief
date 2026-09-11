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
 * Normalizes title into significant keywords for similarity checking
 */
function getHeadlineKeywords(title: string): Set<string> {
  const stopWords = new Set([
    'a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'is', 'are', 'was', 'were',
    'says', 'amid', 'over', 'with', 'by', 'after', 'from', 'into', 'its', 'their', 'new', 'as', 'about',
    'have', 'has', 'had', 'been', 'will', 'would', 'could', 'should', 'more', 'than', 'this', 'that'
  ]);
  const words = (title || '')
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  return new Set(words);
}

/**
 * Checks if two headlines are reporting on the same event/story
 */
function areTitlesSimilar(title1: string, title2: string): boolean {
  if (!title1 || !title2) return false;
  if (title1.toLowerCase() === title2.toLowerCase()) return true;

  const set1 = getHeadlineKeywords(title1);
  const set2 = getHeadlineKeywords(title2);
  if (set1.size === 0 || set2.size === 0) return false;

  let intersection = 0;
  for (const w of set1) {
    if (set2.has(w)) intersection++;
  }
  const minSize = Math.min(set1.size, set2.size);
  return (intersection / minSize >= 0.5) || (intersection >= 4);
}

/**
 * Deterministic scoring algorithm for selecting Hero and Trending stories
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

  // Freshness component (strongly favor stories within last 24-48 hours)
  let freshnessBonus = 0;
  if (ageHours <= 6) freshnessBonus = 40;
  else if (ageHours <= 18) freshnessBonus = 25;
  else if (ageHours <= 36) freshnessBonus = 15;
  else if (ageHours <= 72) freshnessBonus = 8;

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
 * deduplicates similar topics in top spots, and ensures old/aging stories gracefully
 * flow into their respective category sections.
 */
export async function getHomepageData(): Promise<HomepageData> {
  try {
    // 1. Fetch all PUBLISHED articles from Database (up to 200 for rich category archives)
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
      take: 200,
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

    // ── Global Identity Tracker ──────────────────────────────────────────────
    const usedIds = new Set<string>();

    function isExactDuplicate(article: Article): boolean {
      if (usedIds.has(article.id)) return true;
      if (usedIds.has(`slug:${article.slug}`)) return true;
      if (usedIds.has(`path:${article.category.slug}/${article.slug}`)) return true;
      const clusterId = (article as { storyClusterId?: string }).storyClusterId;
      if (clusterId && usedIds.has(`cluster:${clusterId}`)) return true;
      return false;
    }

    function markUsed(article: Article) {
      usedIds.add(article.id);
      usedIds.add(`slug:${article.slug}`);
      usedIds.add(`path:${article.category.slug}/${article.slug}`);
      const clusterId = (article as { storyClusterId?: string }).storyClusterId;
      if (clusterId) usedIds.add(`cluster:${clusterId}`);
    }

    // Reserve breaking item if present
    if (breakingItem) {
      const breakingArt = allAvailable.find((a) => a.id === breakingItem!.id);
      if (breakingArt) markUsed(breakingArt);
    }

    // 4. Hero Featured Story (Highest priority score)
    const rankedByPriority = [...scoredArticles].sort((a, b) => b.priorityScore - a.priorityScore);
    const heroPool = rankedByPriority.map((s) => s.article);

    let featured: Article = allAvailable[0];
    for (const cand of heroPool) {
      if (!isExactDuplicate(cand)) {
        featured = cand;
        markUsed(cand);
        break;
      }
    }

    // 5. Hero Secondary Stories (Top 3 distinct stories)
    // Rules:
    // - No exact duplicates
    // - No similar headlines to Featured story or to each other
    // - Category diversity: prefer picking from different categories
    const secondary: Article[] = [];
    const selectedSecondaryCategories = new Set<string>([featured.category.slug]);

    // Pass 1: Look for distinct category + non-similar stories
    for (const cand of heroPool) {
      if (secondary.length >= 3) break;
      if (isExactDuplicate(cand)) continue;
      if (areTitlesSimilar(cand.title, featured.title)) continue;
      if (secondary.some((s) => areTitlesSimilar(cand.title, s.title))) continue;

      if (!selectedSecondaryCategories.has(cand.category.slug)) {
        secondary.push(cand);
        markUsed(cand);
        selectedSecondaryCategories.add(cand.category.slug);
      }
    }

    // Pass 2: Fill any remaining secondary slots if diversity pass was too strict
    if (secondary.length < 3) {
      for (const cand of heroPool) {
        if (secondary.length >= 3) break;
        if (isExactDuplicate(cand)) continue;
        if (areTitlesSimilar(cand.title, featured.title)) continue;
        if (secondary.some((s) => areTitlesSimilar(cand.title, s.title))) continue;

        secondary.push(cand);
        markUsed(cand);
      }
    }

    // 6. Latest News (Chronologically newest 8 stories)
    const chronological = [...allAvailable].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const latestArticles: Article[] = [];
    for (const cand of chronological) {
      if (latestArticles.length >= 8) break;
      if (!isExactDuplicate(cand)) {
        latestArticles.push(cand);
        markUsed(cand);
      }
    }

    // 7. Trending News (Top 5 by trending score)
    const rankedByTrending = [...scoredArticles].sort((a, b) => b.trendingScore - a.trendingScore);
    const trendingArticles: Article[] = [];
    for (const item of rankedByTrending) {
      if (trendingArticles.length >= 5) break;
      if (!isExactDuplicate(item.article)) {
        trendingArticles.push(item.article);
        markUsed(item.article);
      }
    }

    // 8. Category Sections (Technology, India, World, AI, Business, Finance, Science, Startups, Sports, Gaming, Entertainment)
    // As stories age out of Hero/Latest, they flow into their respective category sections!
    const targetCategories = [
      'technology',
      'india',
      'world',
      'ai',
      'business',
      'finance',
      'science',
      'startups',
      'sports',
      'gaming',
      'entertainment',
    ];

    const categoryArticles: Record<string, Article[]> = {};

    for (const catSlug of targetCategories) {
      const catArticles: Article[] = [];

      // A) All unreserved published DB articles for this category, newest first
      const matchedDb = dbArticles.filter(
        (a) => a.category.slug.toLowerCase() === catSlug.toLowerCase()
      );

      for (const a of matchedDb) {
        if (catArticles.length >= 4) break;
        if (!isExactDuplicate(a)) {
          catArticles.push(a);
          markUsed(a);
        }
      }

      // B) Backfill from high-quality curated mock articles if needed
      if (catArticles.length < 4) {
        const matchedMock = mockArticles.filter(
          (a) => a.category.slug.toLowerCase() === catSlug.toLowerCase()
        );

        for (const m of matchedMock) {
          if (catArticles.length >= 4) break;
          if (!isExactDuplicate(m) && !catArticles.some((existing) => areTitlesSimilar(existing.title, m.title))) {
            catArticles.push(m);
            markUsed(m);
          }
        }
      }

      categoryArticles[catSlug] = catArticles;
    }

    return {
      breakingItem,
      featured,
      secondary,
      latestArticles,
      trendingArticles,
      categoryArticles,
      latestPublishedAt,
      latestArticleId,
    };
  } catch (error) {
    console.error('[HomepageData] Error loading published stories from database:', error);

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

