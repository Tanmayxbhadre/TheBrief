import { prisma } from '../db';
import { getAllPublishedArticles } from '../articles';

export interface StructuredDailyBrief {
  topStories: Array<{
    id: string;
    title: string;
    url: string;
    category: string;
    excerpt: string;
    sourcesCount?: number;
  }>;
  whatYouMissed: Array<{
    id: string;
    title: string;
    url: string;
    category: string;
    summaryPoint: string;
  }>;
  categoryRoundup: Record<
    string,
    Array<{
      id: string;
      title: string;
      url: string;
      oneLiner: string;
    }>
  >;
  whatToWatch: string[];
}

/**
 * Generates or refreshes the Daily Briefing from published articles
 */
export async function generateDailyBriefing(briefType: 'morning' | 'evening' = 'morning'): Promise<string> {
  const allArticles = await getAllPublishedArticles();

  if (allArticles.length === 0) {
    throw new Error('No published articles available to generate Daily Brief');
  }

  // Sort by featured, breaking, and published date
  const sorted = [...allArticles].sort((a, b) => {
    if (a.breaking && !b.breaking) return -1;
    if (!a.breaking && b.breaking) return 1;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  const topStories = sorted.slice(0, 4).map((a) => ({
    id: a.id,
    title: a.title,
    url: `/${a.category.slug}/${a.slug}`,
    category: a.category.name,
    excerpt: a.description || a.quickSummary?.[0] || 'Key developments unfolding.',
    sourcesCount: a.sources?.length || 1,
  }));

  const whatYouMissed = sorted.slice(4, 8).map((a) => ({
    id: a.id,
    title: a.title,
    url: `/${a.category.slug}/${a.slug}`,
    category: a.category.name,
    summaryPoint: a.quickSummary?.[0] || a.description || a.title,
  }));

  const categories = ['technology', 'ai', 'india', 'business', 'science', 'world'];
  const categoryRoundup: Record<string, Array<{ id: string; title: string; url: string; oneLiner: string }>> = {};

  for (const cat of categories) {
    const items = sorted.filter((a) => a.category.slug === cat).slice(0, 3);
    if (items.length > 0) {
      categoryRoundup[cat] = items.map((a) => ({
        id: a.id,
        title: a.title,
        url: `/${a.category.slug}/${a.slug}`,
        oneLiner: a.description || a.title,
      }));
    }
  }

  const whatToWatch = [
    'Major technology earnings reports and regulatory filings expected this week.',
    'Follow-up updates on key AI foundation model benchmarking and safety standards.',
    'Upcoming macroeconomic policy shifts and central bank rate guidance.',
  ];

  const briefContent: StructuredDailyBrief = {
    topStories,
    whatYouMissed,
    categoryRoundup,
    whatToWatch,
  };

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const title = `THE DAILY BRIEF — ${briefType === 'morning' ? 'Morning Edition' : 'Evening Edition'} (${dateStr})`;
  const slug = `daily-brief-${briefType}-${dateStr}`;

  // Upsert daily briefing
  const briefing = await prisma.dailyBriefing.upsert({
    where: { slug },
    update: {
      title,
      content: JSON.stringify(briefContent),
      summary: `Your 5-minute catch-up across ${topStories.length} top stories, ${categories.length} sectors, and what to watch next.`,
      updatedAt: now,
    },
    create: {
      title,
      slug,
      date: now,
      briefType,
      summary: `Your 5-minute catch-up across ${topStories.length} top stories, ${categories.length} sectors, and what to watch next.`,
      content: JSON.stringify(briefContent),
      status: 'PUBLISHED',
      publishedAt: now,
    },
  });

  return briefing.id;
}

/**
 * Retrieves the latest Daily Briefing, generating one automatically if none exists
 */
export async function getLatestDailyBriefing(briefType?: string): Promise<{
  briefing: {
    id: string;
    title: string;
    slug: string;
    date: Date;
    briefType: string;
    summary: string;
  };
  content: StructuredDailyBrief;
}> {
  let dbBriefing = await prisma.dailyBriefing.findFirst({
    where: {
      status: 'PUBLISHED',
      ...(briefType ? { briefType } : {}),
    },
    orderBy: { date: 'desc' },
  });

  if (!dbBriefing) {
    // Generate one automatically on first request
    try {
      const id = await generateDailyBriefing((briefType as 'morning' | 'evening') || 'morning');
      dbBriefing = await prisma.dailyBriefing.findUnique({ where: { id } });
    } catch {
      // Fallback
    }
  }

  if (dbBriefing) {
    try {
      const parsed = JSON.parse(dbBriefing.content);
      return {
        briefing: dbBriefing,
        content: parsed,
      };
    } catch {}
  }

  // Fallback structure if database is empty
  const allArticles = await getAllPublishedArticles();
  return {
    briefing: {
      id: 'mock-briefing',
      title: 'THE DAILY BRIEF — Morning Edition',
      slug: 'daily-brief-morning',
      date: new Date(),
      briefType: 'morning',
      summary: 'Your 5-minute catch-up across all major developments.',
    },
    content: {
      topStories: allArticles.slice(0, 3).map((a) => ({
        id: a.id,
        title: a.title,
        url: `/${a.category.slug}/${a.slug}`,
        category: a.category.name,
        excerpt: a.description,
        sourcesCount: a.sources?.length || 1,
      })),
      whatYouMissed: allArticles.slice(3, 6).map((a) => ({
        id: a.id,
        title: a.title,
        url: `/${a.category.slug}/${a.slug}`,
        category: a.category.name,
        summaryPoint: a.description,
      })),
      categoryRoundup: {},
      whatToWatch: ['Global tech summits and policy briefings underway.'],
    },
  };
}
