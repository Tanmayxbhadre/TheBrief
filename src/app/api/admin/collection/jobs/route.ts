import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch recent jobs
    const jobs = await prisma.collectionJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 30,
    });

    // 2. Fetch source health
    const sources = await prisma.source.findMany({
      orderBy: { priority: 'asc' },
    });

    const totalSources = sources.length;
    const enabledSources = sources.filter((s) => s.enabled);
    const healthySources = enabledSources.filter((s) => !s.lastError && s.consecutiveFailures === 0);
    const warningSources = enabledSources.filter((s) => s.consecutiveFailures > 0 && s.consecutiveFailures < 3);
    const errorSources = enabledSources.filter((s) => s.consecutiveFailures >= 3);

    // 3. Compute timestamps & system health
    const latestJob = jobs[0] || null;
    const latestSuccessfulJob = jobs.find((j) => j.status === 'COMPLETED' || j.status === 'PARTIAL') || null;

    const now = Date.now();
    const lastSuccessfulRunTime = latestSuccessfulJob?.completedAt
      ? new Date(latestSuccessfulJob.completedAt).getTime()
      : null;

    // Stale if no successful run in 2 hours
    const isStale = lastSuccessfulRunTime ? now - lastSuccessfulRunTime > 2 * 60 * 60 * 1000 : true;

    // Overall system status
    let systemStatus: 'HEALTHY' | 'WARNING' | 'ERROR' | 'DISABLED' = 'HEALTHY';
    if (enabledSources.length === 0) {
      systemStatus = 'DISABLED';
    } else if (errorSources.length > 0 || isStale) {
      systemStatus = 'WARNING';
    }
    if (jobs.length > 0 && jobs.slice(0, 3).every((j) => j.status === 'FAILED')) {
      systemStatus = 'ERROR';
    }

    // 4. Calculate today's metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayJobs = jobs.filter((j) => new Date(j.startedAt) >= startOfToday);
    const newItemsToday = todayJobs.reduce((sum, j) => sum + j.itemsInserted, 0);
    const duplicatesToday = todayJobs.reduce((sum, j) => sum + j.duplicates, 0);

    return NextResponse.json({
      summary: {
        systemStatus,
        isStale,
        lastRun: latestJob?.startedAt || null,
        lastSuccessfulRun: latestSuccessfulJob?.completedAt || null,
        totalSourcesCount: totalSources,
        enabledSourcesCount: enabledSources.length,
        healthySourcesCount: healthySources.length,
        warningSourcesCount: warningSources.length,
        failedSourcesCount: errorSources.length,
        newItemsToday,
        duplicatesToday,
        runsTodayCount: todayJobs.length,
      },
      jobs,
      sources,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch collection telemetry';
    console.error('Error in /api/admin/collection/jobs:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
