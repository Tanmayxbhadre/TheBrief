import { NextResponse } from 'next/server';
import { runAutoPublishWorker } from '@/lib/ai/autoPublishWorker';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * Dedicated Auto-Publish Sweep Endpoint
 * Triggered by Vercel Cron at :30 past each hour (30 min after the main news cron).
 * Finds APPROVED drafts that meet quality/confidence thresholds and publishes them.
 * Protected via CRON_SECRET — same auth pattern as /api/cron/news.
 */
export async function GET(request: Request) {
  return handlePublishCron(request);
}

export async function POST(request: Request) {
  return handlePublishCron(request);
}

async function handlePublishCron(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[PUBLISH-CRON] CRON_SECRET is not configured on server.');
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
      console.warn('[PUBLISH-CRON] Unauthorized attempt.');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[PUBLISH-CRON] Starting auto-publish sweep...');

    const result = await runAutoPublishWorker(20);

    // Revalidate homepage/category caches if anything was published
    if (result.published > 0) {
      try {
        const { revalidateNewsCache } = await import('@/lib/revalidate');
        revalidateNewsCache();
      } catch (revErr) {
        console.warn('[PUBLISH-CRON] Cache revalidation skipped:', revErr);
      }
    }

    return NextResponse.json({
      success: true,
      autoPublish: {
        swept: result.swept,
        published: result.published,
        skipped: result.skipped,
        errors: result.errors.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('[PUBLISH-CRON] Uncaught error:', message);
    return NextResponse.json(
      { success: false, error: 'Auto-publish sweep failed' },
      { status: 500 }
    );
  }
}
