import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Lightweight, non-sensitive cron/pipeline status endpoint.
 * Lets you (or an uptime monitor) verify the hourly automated pipeline is
 * actually running without exposing any secrets or admin-only data.
 *
 * GET /api/cron/status
 */
export async function GET() {
  try {
    const [lastJob, last24hJobs, publishedCount, publishedLast24h, autoPublishedLast24h] =
      await Promise.all([
        prisma.collectionJob.findFirst({
          orderBy: { startedAt: 'desc' },
        }),
        prisma.collectionJob.findMany({
          where: { startedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
          orderBy: { startedAt: 'desc' },
          take: 24,
          select: {
            trigger: true,
            status: true,
            startedAt: true,
            completedAt: true,
            itemsFound: true,
            itemsInserted: true,
            duplicates: true,
            failedSources: true,
          },
        }),
        prisma.articleDraft.count({ where: { status: 'PUBLISHED' } }),
        prisma.articleDraft.count({
          where: {
            status: 'PUBLISHED',
            publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
        prisma.articleDraft.count({
          where: {
            status: 'PUBLISHED',
            autoPublished: true,
            publishedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          },
        }),
      ]);

    const status = !lastJob
      ? 'never_run'
      : lastJob.status === 'FAILED'
        ? 'failed'
        : lastJob.status === 'RUNNING'
          ? 'running'
          : 'success';

    return NextResponse.json(
      {
        status,
        lastRun: lastJob?.startedAt ?? null,
        lastRunCompletedAt: lastJob?.completedAt ?? null,
        lastRunStatus: lastJob?.status ?? null,
        lastRunTrigger: lastJob?.trigger ?? null,
        articlesFetched: lastJob?.itemsFound ?? 0,
        articlesInserted: lastJob?.itemsInserted ?? 0,
        duplicatesSkipped: lastJob?.duplicates ?? 0,
        failedSources: lastJob?.failedSources ?? 0,
        articlesPublished: publishedCount,
        articlesPublishedLast24h: publishedLast24h,
        autoPublishedLast24h,
        runsLast24h: last24hJobs.length,
        recentRuns: last24hJobs,
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    );
  } catch (error) {
    console.error('[CRON-STATUS] Failed to load status:', error);
    return NextResponse.json({ status: 'error', error: 'Failed to load cron status' }, { status: 500 });
  }
}
