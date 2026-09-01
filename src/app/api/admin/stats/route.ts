import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      newStoriesCount,
      reviewCount,
      approvedNewsCount,
      draftsCount,
      publishedCount,
      publishedTodayCount,
      totalSourcesCount,
      errorSourcesCount,
      recentActivity,
      recentStories,
    ] = await Promise.all([
      // Real DB counts
      prisma.newsItem.count({ where: { status: 'DISCOVERED' } }),
      prisma.newsItem.count({ where: { status: 'REVIEW' } }),
      prisma.newsItem.count({ where: { status: 'APPROVED' } }),
      prisma.articleDraft.count({ where: { status: { in: ['DRAFT', 'REVIEW', 'APPROVED'] } } }),
      prisma.articleDraft.count({ where: { status: 'PUBLISHED' } }),
      prisma.articleDraft.count({
        where: {
          status: 'PUBLISHED',
          publishedAt: { gte: startOfToday },
        },
      }),
      prisma.source.count(),
      prisma.source.count({ where: { lastError: { not: null }, enabled: true } }),
      prisma.activityLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.newsItem.findMany({
        where: { status: { in: ['DISCOVERED', 'REVIEW'] } },
        include: { source: true, category: true },
        orderBy: { discoveredAt: 'desc' },
        take: 5,
      }),
    ]);

    return NextResponse.json({
      stats: {
        newStories: newStoriesCount,
        review: reviewCount,
        approved: approvedNewsCount,
        drafts: draftsCount,
        published: publishedCount,
        publishedToday: publishedTodayCount,
        totalSources: totalSourcesCount,
        failedSources: errorSourcesCount,
      },
      recentActivity,
      recentStories,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
