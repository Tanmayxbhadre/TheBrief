import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { aiService } from '@/lib/ai/service';
import { getQueueStats } from '@/lib/queue/jobQueue';
import { getEnvironmentDiagnostics } from '@/lib/envCheck';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  // 1. Check Database
  let dbStatus = 'HEALTHY';
  let dbLatencyMs = 0;
  try {
    const dbStart = Date.now();
    await prisma.source.count();
    dbLatencyMs = Date.now() - dbStart;
  } catch (err) {
    dbStatus = 'UNHEALTHY';
    console.error('[HEALTH-CHECK] Database error:', err);
  }

  // 2. AI Provider Status
  const aiInfo = aiService.getProviderInfo();
  const aiStatus = aiService.isEnabled() ? 'HEALTHY' : 'DISABLED';

  // 3. Queue Stats
  let queueStats = { pending: 0, processing: 0, completed: 0, failed: 0, total: 0 };
  try {
    queueStats = await getQueueStats();
  } catch (err) {
    console.warn('[HEALTH-CHECK] Failed to fetch queue stats:', err);
  }

  // 4. Ingestion & Sources
  let sourceCount = 0;
  let healthySources = 0;
  let lastCollectionJob: { status: string; completedAt: Date | null; startedAt: Date } | null = null;
  try {
    sourceCount = await prisma.source.count();
    healthySources = await prisma.source.count({ where: { consecutiveFailures: 0 } });
    lastCollectionJob = await prisma.collectionJob.findFirst({
      orderBy: { startedAt: 'desc' },
      select: { status: true, completedAt: true, startedAt: true },
    });
  } catch (err) {
    console.warn('[HEALTH-CHECK] Source query error:', err);
  }

  // 5. Editorial / Article metrics
  let publishedCount = 0;
  let draftsCount = 0;
  let clustersCount = 0;
  try {
    [publishedCount, draftsCount, clustersCount] = await Promise.all([
      prisma.articleDraft.count({ where: { status: 'PUBLISHED' } }),
      prisma.articleDraft.count({ where: { status: 'DRAFT' } }),
      prisma.storyCluster.count(),
    ]);
  } catch (err) {
    console.warn('[HEALTH-CHECK] Draft count error:', err);
  }

  const overallHealthy = dbStatus === 'HEALTHY' && (queueStats.failed === 0 || queueStats.failed < 5);

  return NextResponse.json({
    status: overallHealthy ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    latencyMs: Date.now() - startTime,
    components: {
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
      aiProvider: {
        status: aiStatus,
        provider: aiInfo.provider,
        model: aiInfo.model,
        isMock: aiInfo.isMock,
        isConfigured: aiInfo.isConfigured,
      },
      queue: {
        status: queueStats.failed > 5 ? 'DEGRADED' : 'HEALTHY',
        stats: queueStats,
      },
      sources: {
        total: sourceCount,
        healthy: healthySources,
        lastCollection: lastCollectionJob,
      },
      editorial: {
        publishedArticles: publishedCount,
        pendingDrafts: draftsCount,
        storyClusters: clustersCount,
      },
      environment: getEnvironmentDiagnostics(),
    },
  });
}
