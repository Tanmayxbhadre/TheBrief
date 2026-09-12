import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Lightweight News Version Check API
 * Allows client-side live listeners across the entire site to check if new stories
 * have been published without downloading large payloads.
 */
export async function GET() {
  try {
    const [latestArticle, count] = await Promise.all([
      prisma.articleDraft.findFirst({
        where: { status: 'PUBLISHED' },
        select: {
          id: true,
          title: true,
          slug: true,
          breaking: true,
          publishedAt: true,
          updatedAt: true,
          category: {
            select: { slug: true, name: true },
          },
        },
        orderBy: { publishedAt: 'desc' },
      }),
      prisma.articleDraft.count({
        where: { status: 'PUBLISHED' },
      }),
    ]);

    const latestPublishedAt = latestArticle?.publishedAt
      ? new Date(latestArticle.publishedAt).toISOString()
      : null;

    const latestUpdatedAt = latestArticle?.updatedAt
      ? new Date(latestArticle.updatedAt).toISOString()
      : null;

    return NextResponse.json(
      {
        latestArticleId: latestArticle?.id || null,
        latestTitle: latestArticle?.title || null,
        latestSlug: latestArticle?.slug || null,
        categorySlug: latestArticle?.category?.slug || 'news',
        categoryName: latestArticle?.category?.name || 'General',
        isBreaking: latestArticle?.breaking || false,
        latestPublishedAt,
        latestUpdatedAt,
        count,
        timestamp: Date.now(),
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Failed to check news version:', error);
    return NextResponse.json({ error: 'Failed to check version' }, { status: 500 });
  }
}
