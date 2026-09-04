import { prisma } from './db';
import { Article, Source, TimelineEvent, WhatYouNeedToKnow } from './types';
import { articles as mockArticles } from './mock-data';
import slugify from 'slugify';
import { ArticleDraft, Category as PrismaCategory } from '@prisma/client';

type DraftWithCategory = ArticleDraft & {
  category: PrismaCategory | null;
};

export function draftToArticle(draft: DraftWithCategory): Article {
  let sources: Source[] = [];
  try {
    if (draft.sources) sources = typeof draft.sources === 'string' ? JSON.parse(draft.sources) : draft.sources;
  } catch {}

  let quickSummary: string[] = [];
  try {
    if (draft.quickSummary) {
      quickSummary = typeof draft.quickSummary === 'string' ? JSON.parse(draft.quickSummary) : draft.quickSummary;
    }
  } catch {}

  let whatYouNeedToKnow: WhatYouNeedToKnow | undefined = undefined;
  try {
    if (draft.whatYouNeedToKnow) {
      whatYouNeedToKnow =
        typeof draft.whatYouNeedToKnow === 'string'
          ? JSON.parse(draft.whatYouNeedToKnow)
          : draft.whatYouNeedToKnow;
    }
  } catch {}

  let timeline: TimelineEvent[] = [];
  try {
    if (draft.timeline) {
      timeline = typeof draft.timeline === 'string' ? JSON.parse(draft.timeline) : draft.timeline;
    }
  } catch {}

  let tags: string[] = [];
  try {
    if (draft.tags) {
      tags = typeof draft.tags === 'string' ? JSON.parse(draft.tags) : draft.tags;
    }
  } catch {}

  return {
    id: draft.id,
    title: draft.title,
    slug: draft.slug,
    description: draft.excerpt || '',
    content: draft.content || '',
    author: {
      id: draft.authorId || 'admin-author',
      name: draft.authorName || 'THE BRIEF Editorial Team',
      slug: slugify(draft.authorName || 'thebrief', { lower: true }),
    },
    category: {
      id: draft.category?.id || 'c1',
      name: draft.category?.name || 'General',
      slug: draft.category?.slug || 'news',
      description: draft.category?.description || '',
      seoTitle: draft.category?.seoTitle || '',
      seoDescription: draft.category?.seoDescription || '',
    },
    publishedAt: draft.publishedAt
      ? new Date(draft.publishedAt).toISOString()
      : new Date(draft.createdAt).toISOString(),
    updatedAt: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : undefined,
    featuredImage:
      draft.featuredImage ||
      'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=1200&h=675&fit=crop',
    imageAlt: draft.imageAlt || draft.title,
    tags,
    readingTime: draft.readingTime || 3,
    sources,
    quickSummary: quickSummary.length > 0 ? quickSummary : undefined,
    whatYouNeedToKnow: whatYouNeedToKnow || undefined,
    timeline: timeline.length > 0 ? timeline : undefined,
    featured: draft.featured,
    breaking: draft.breaking,
  };
}

/**
 * Get single published article by slug
 */
export async function getPublishedArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const dbDraft = await prisma.articleDraft.findFirst({
      where: {
        slug,
        status: 'PUBLISHED',
      },
      include: {
        category: true,
      },
    });

    if (dbDraft) {
      return draftToArticle(dbDraft);
    }
  } catch (err) {
    console.error('Error querying published article by slug:', err);
  }

  // Fallback to mock data
  return mockArticles.find((a) => a.slug === slug);
}

/**
 * Get all published articles merged with mock articles
 */
export async function getAllPublishedArticles(): Promise<Article[]> {
  try {
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
    });

    const dbArticles = dbDrafts.map(draftToArticle);
    const existingSlugs = new Set(dbArticles.map((a) => a.slug));
    const nonDupeMocks = mockArticles.filter((a) => !existingSlugs.has(a.slug));

    // Real published articles from database take priority, followed by baseline mock items
    return [...dbArticles, ...nonDupeMocks];
  } catch (err) {
    console.error('Error fetching all published articles:', err);
    return mockArticles;
  }
}

/**
 * Get published articles by category
 */
export async function getPublishedArticlesByCategory(
  categorySlug: string,
  limit?: number
): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const filtered = all.filter((a) => a.category.slug === categorySlug);
  return limit ? filtered.slice(0, limit) : filtered;
}

/**
 * Get latest published articles
 */
export async function getLatestPublishedArticles(limit = 10): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  return all.slice(0, limit);
}

/**
 * Search published articles
 */
export async function searchPublishedArticles(query: string): Promise<Article[]> {
  const all = await getAllPublishedArticles();
  const q = query.toLowerCase();
  return all.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.tags.some((t) => t.toLowerCase().includes(q)) ||
      a.category.name.toLowerCase().includes(q)
  );
}

/**
 * Get dynamic breaking news headline from DB or mock data
 */
export async function getDynamicBreakingNews(): Promise<import('./types').BreakingNewsItem | undefined> {
  try {
    const breakingDraft = await prisma.articleDraft.findFirst({
      where: {
        status: 'PUBLISHED',
        breaking: true,
      },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
    });

    if (breakingDraft) {
      return {
        id: breakingDraft.id,
        headline: breakingDraft.title,
        url: `/${breakingDraft.category?.slug || 'technology'}/${breakingDraft.slug}`,
        time: breakingDraft.publishedAt
          ? new Date(breakingDraft.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Live',
      };
    }
  } catch (err) {
    console.error('Error querying dynamic breaking news:', err);
  }

  const { getBreakingNews } = await import('./mock-data');
  return getBreakingNews();
}
