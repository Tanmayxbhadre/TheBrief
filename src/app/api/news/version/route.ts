import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Lightweight News Version Check API
 * Allows the client-side live refresh component to check if new news was published
 * without downloading the entire homepage or polling heavyweight endpoints.
 */
export async function GET() {
  try {
    const [latestArticle, count] = await Promise.all([
      prisma.articleDraft.findFirst({
        where: { status: 'PUBLISHED' },
        select: { id: true, publishedAt: true, updatedAt: true },
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
        latestPublishedAt,
        latestUpdatedAt,
        latestArticleId: latestArticle?.id || null,
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
