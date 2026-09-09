import { NextResponse } from 'next/server';
import { runNewsCollectionJob } from '@/lib/news/jobRunner';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // Allow up to 5 minutes on serverless if needed

/**
 * Automated Cron Collection Endpoint
 * Triggered periodically by Vercel Cron, GitHub Actions, or Server crontabs.
 * Protected strictly via CRON_SECRET.
 */
export async function GET(request: Request) {
  return handleCronRequest(request);
}

export async function POST(request: Request) {
  return handleCronRequest(request);
}

async function handleCronRequest(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    // Fail securely if secret is not configured
    if (!cronSecret) {
      console.error('[NEWS-CRON] CRON_SECRET is not configured on server.');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const authHeader = request.headers.get('authorization');
    const customHeader = request.headers.get('x-cron-secret');

    const isBearerValid = authHeader === `Bearer ${cronSecret}`;
    const isCustomValid = customHeader === cronSecret;

    if (!isBearerValid && !isCustomValid) {
      console.warn('[NEWS-CRON] Unauthorized cron attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runNewsCollectionJob({ trigger: 'cron' });

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: result.reason || 'job_already_running',
      });
    }

    // 2. Run clustering on any unassigned news items
    let clusteringSummary = { processed: 0, clustersCreated: 0 };
    try {
      const { clusterUnassignedNewsItems } = await import('@/lib/news/clustering');
      clusteringSummary = await clusterUnassignedNewsItems();
    } catch (clusterErr) {
      console.warn('[NEWS-CRON] Clustering step skipped:', clusterErr);
    }

    // 3. Run background AI drafting worker
    let aiSummary = { processed: 0, draftsCreated: 0 };
    try {
      const { runArticleGenerationWorker } = await import('@/lib/ai/articleGenerationWorker');
      aiSummary = await runArticleGenerationWorker(3);
    } catch (aiErr) {
      console.warn('[NEWS-CRON] AI worker step skipped:', aiErr);
    }

    // 4. Tick the background job queue
    let queueSummary = { processed: 0, completed: 0, failed: 0 };
    try {
      const { runJobWorkerTick } = await import('@/lib/queue/jobQueue');
      queueSummary = await runJobWorkerTick(3);
    } catch (qErr) {
      console.warn('[NEWS-CRON] Job queue tick skipped:', qErr);
    }

    // 5. Auto-publish APPROVED drafts that meet quality/confidence thresholds
    let autoPublishSummary = { swept: 0, published: 0, skipped: 0, errors: 0 };
    try {
      const { runAutoPublishWorker } = await import('@/lib/ai/autoPublishWorker');
      const apResult = await runAutoPublishWorker(20);
      autoPublishSummary = {
        swept: apResult.swept,
        published: apResult.published,
        skipped: apResult.skipped,
        errors: apResult.errors.length,
      };
    } catch (apErr) {
      console.warn('[NEWS-CRON] Auto-publish step skipped:', apErr);
    }

    // 6. Revalidate cache
    try {
      const { revalidateNewsCache } = await import('@/lib/revalidate');
      revalidateNewsCache();
    } catch (revErr) {
      console.warn('[NEWS-CRON] Cache revalidation skipped:', revErr);
    }

    return NextResponse.json({
      success: result.success,
      jobId: result.jobId,
      status: result.status,
      collection: {
        sourcesProcessed: result.sourcesProcessed,
        newItems: result.newItems,
        duplicates: result.duplicates,
        failedSources: result.failedSources,
        durationMs: result.durationMs,
      },
      clustering: clusteringSummary,
      aiGeneration: aiSummary,
      queue: queueSummary,
      autoPublish: autoPublishSummary,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[NEWS-CRON] Uncaught cron endpoint error:', message);
    return NextResponse.json(
      { success: false, error: 'News collection job failed' },
      { status: 500 }
    );
  }
}
