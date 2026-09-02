import { prisma } from '../db';
import { collectAllNews, CollectionSummary } from './collector';

export interface JobRunnerResult {
  success: boolean;
  jobId?: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'SKIPPED';
  skipped?: boolean;
  reason?: string;
  sourcesProcessed: number;
  newItems: number;
  duplicates: number;
  failedSources: number;
  itemsFound: number;
  durationMs: number;
  errorMessage?: string;
}

const JOB_LOCK_NAME = 'news-collection';
const DEFAULT_LOCK_TTL_MS = 180_000; // 3 minutes TTL

/**
 * Attempts to acquire a durable database lock for the collection job.
 * Automatically purges expired locks to prevent deadlocks after unexpected crashes.
 */
async function acquireCollectionLock(
  jobName: string = JOB_LOCK_NAME,
  ttlMs: number = DEFAULT_LOCK_TTL_MS
): Promise<{ acquired: boolean; lockId?: string; reason?: string }> {
  const now = new Date();

  // 1. Clean up any expired locks
  try {
    await prisma.collectionJobLock.deleteMany({
      where: {
        jobName,
        expiresAt: { lt: now },
      },
    });
  } catch (err) {
    console.error('[JOB-LOCK] Failed to clean expired locks:', err);
  }

  // 2. Try acquiring lock atomically
  try {
    const lock = await prisma.collectionJobLock.create({
      data: {
        jobName,
        acquiredAt: now,
        expiresAt: new Date(now.getTime() + ttlMs),
      },
    });
    return { acquired: true, lockId: lock.id };
  } catch {
    // Unique constraint error indicates active job is running
    return { acquired: false, reason: 'job_already_running' };
  }
}

/**
 * Releases the durable database lock.
 */
async function releaseCollectionLock(jobName: string = JOB_LOCK_NAME): Promise<void> {
  try {
    await prisma.collectionJobLock.deleteMany({
      where: { jobName },
    });
  } catch (err) {
    console.error('[JOB-LOCK] Error releasing lock:', err);
  }
}

/**
 * Main entry point for all news collection executions (Cron, Manual, CLI, Dev Watch).
 * Guarantees durable locking, job lifecycle auditing, source health tracking, and error safety.
 */
export async function runNewsCollectionJob(options?: {
  trigger?: 'cron' | 'manual' | 'cli' | 'watch' | 'webhook';
}): Promise<JobRunnerResult> {
  const trigger = options?.trigger || 'cron';
  const startTime = Date.now();
  console.log(`[NEWS-CRON] [${trigger.toUpperCase()}] Initiating collection job...`);

  // 1. Acquire durable database lock
  const lockResult = await acquireCollectionLock(JOB_LOCK_NAME);

  if (!lockResult.acquired) {
    console.warn(`[NEWS-CRON] [${trigger.toUpperCase()}] Collection skipped: ${lockResult.reason}`);
    return {
      success: true,
      status: 'SKIPPED',
      skipped: true,
      reason: lockResult.reason,
      sourcesProcessed: 0,
      newItems: 0,
      duplicates: 0,
      failedSources: 0,
      itemsFound: 0,
      durationMs: Date.now() - startTime,
    };
  }

  // 2. Create running job record in DB
  let jobRecord: { id: string } | null = null;
  try {
    jobRecord = await prisma.collectionJob.create({
      data: {
        trigger,
        startedAt: new Date(),
        status: 'RUNNING',
      },
    });
  } catch (err) {
    console.error('[NEWS-CRON] Failed to initialize CollectionJob record:', err);
  }

  let summary: CollectionSummary | null = null;
  let fatalError: string | null = null;

  try {
    // 3. Execute collection
    summary = await collectAllNews();

    const durationMs = Date.now() - startTime;
    const isPartial = summary.failedSources > 0 && summary.successfulSources > 0;
    const isFailed = summary.failedSources > 0 && summary.successfulSources === 0 && summary.sourcesProcessed > 0;
    const status: 'COMPLETED' | 'PARTIAL' | 'FAILED' = isFailed ? 'FAILED' : isPartial ? 'PARTIAL' : 'COMPLETED';

    // 4. Update job record
    if (jobRecord) {
      await prisma.collectionJob.update({
        where: { id: jobRecord.id },
        data: {
          completedAt: new Date(),
          status,
          sourcesProcessed: summary.sourcesProcessed,
          successfulSources: summary.successfulSources,
          failedSources: summary.failedSources,
          itemsFound: summary.itemsFound,
          itemsInserted: summary.newItems,
          duplicates: summary.duplicates,
          errorCount: summary.failedSources,
          durationMs,
          sourceErrors: summary.sourceErrors ? JSON.stringify(summary.sourceErrors) : null,
        },
      });
    }

    console.log(
      `[NEWS-CRON] [${trigger.toUpperCase()}] Job ${status}: ${summary.newItems} new items, ${summary.duplicates} duplicates from ${summary.successfulSources}/${summary.sourcesProcessed} sources in ${durationMs}ms.`
    );

    return {
      success: status !== 'FAILED',
      jobId: jobRecord?.id,
      status,
      sourcesProcessed: summary.sourcesProcessed,
      newItems: summary.newItems,
      duplicates: summary.duplicates,
      failedSources: summary.failedSources,
      itemsFound: summary.itemsFound,
      durationMs,
    };
  } catch (err: unknown) {
    fatalError = err instanceof Error ? err.message : 'Fatal news collection exception';
    const durationMs = Date.now() - startTime;
    console.error(`[NEWS-CRON] [${trigger.toUpperCase()}] Fatal error: ${fatalError}`);

    if (jobRecord) {
      await prisma.collectionJob.update({
        where: { id: jobRecord.id },
        data: {
          completedAt: new Date(),
          status: 'FAILED',
          durationMs,
          errorMessage: fatalError,
        },
      });
    }

    return {
      success: false,
      jobId: jobRecord?.id,
      status: 'FAILED',
      errorMessage: fatalError,
      sourcesProcessed: 0,
      newItems: 0,
      duplicates: 0,
      failedSources: 0,
      itemsFound: 0,
      durationMs,
    };
  } finally {
    // 5. Always release durable lock
    await releaseCollectionLock(JOB_LOCK_NAME);
  }
}
