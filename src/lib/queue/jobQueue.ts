import { prisma } from '../db';
import { runNewsCollectionJob } from '../news/jobRunner';
import { runArticleGenerationWorker } from '../ai/articleGenerationWorker';
import { clusterUnassignedNewsItems } from '../news/clustering';

export type JobType =
  | 'NEWS_COLLECTION'
  | 'AI_PROCESSING'
  | 'STORY_CLUSTERING'
  | 'PUBLISHING'
  | 'DAILY_BRIEF'
  | 'CLEANUP';

export interface EnqueueJobOptions {
  type: JobType;
  payload?: Record<string, unknown>;
  maxAttempts?: number;
  scheduledAt?: Date;
}

/**
 * Enqueues a new background job into the database queue
 */
export async function enqueueJob(options: EnqueueJobOptions): Promise<string> {
  const job = await prisma.job.create({
    data: {
      type: options.type,
      payload: options.payload ? JSON.stringify(options.payload) : null,
      maxAttempts: options.maxAttempts || 3,
      scheduledAt: options.scheduledAt || new Date(),
      status: 'PENDING',
    },
  });

  return job.id;
}

/**
 * Atomically claims the next pending job scheduled to run
 */
export async function claimNextJob(): Promise<{
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
} | null> {
  const now = new Date();

  // Find next pending job whose scheduled time has arrived
  const candidate = await prisma.job.findFirst({
    where: {
      status: 'PENDING',
      scheduledAt: { lte: now },
    },
    orderBy: { scheduledAt: 'asc' },
  });

  if (!candidate) return null;

  // Claim the job atomically
  try {
    const updated = await prisma.job.update({
      where: {
        id: candidate.id,
        status: 'PENDING', // concurrency check
      },
      data: {
        status: 'PROCESSING',
        startedAt: now,
        attempts: { increment: 1 },
      },
    });

    let parsedPayload: Record<string, unknown> | null = null;
    try {
      if (updated.payload) parsedPayload = JSON.parse(updated.payload);
    } catch {}

    return {
      id: updated.id,
      type: updated.type,
      payload: parsedPayload,
      attempts: updated.attempts,
      maxAttempts: updated.maxAttempts,
    };
  } catch {
    // Already claimed by another worker
    return null;
  }
}

/**
 * Marks a job as completed
 */
export async function completeJob(jobId: string): Promise<void> {
  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETED',
      completedAt: new Date(),
      error: null,
    },
  });
}

/**
 * Marks a job as failed or reschedules if attempts remain
 */
export async function failJob(jobId: string, error: string, attempts: number, maxAttempts: number): Promise<void> {
  const hasRemainingAttempts = attempts < maxAttempts;
  const backoffSeconds = Math.pow(2, attempts) * 30; // Exponential backoff: 60s, 120s...
  const nextAttemptAt = new Date(Date.now() + backoffSeconds * 1000);

  await prisma.job.update({
    where: { id: jobId },
    data: {
      status: hasRemainingAttempts ? 'PENDING' : 'FAILED',
      scheduledAt: hasRemainingAttempts ? nextAttemptAt : undefined,
      error,
      completedAt: hasRemainingAttempts ? null : new Date(),
    },
  });
}

/**
 * Executes a single claimed job
 */
export async function processJob(job: {
  id: string;
  type: string;
  payload: Record<string, unknown> | null;
  attempts: number;
  maxAttempts: number;
}): Promise<{ success: boolean; result?: unknown; error?: string }> {
  try {
    let result: unknown = null;

    switch (job.type) {
      case 'NEWS_COLLECTION': {
        result = await runNewsCollectionJob({ trigger: 'cron' });
        break;
      }
      case 'STORY_CLUSTERING': {
        result = await clusterUnassignedNewsItems();
        break;
      }
      case 'AI_PROCESSING': {
        result = await runArticleGenerationWorker(5);
        break;
      }
      case 'CLEANUP': {
        // Purge completed jobs older than 7 days
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        await prisma.job.deleteMany({
          where: {
            status: { in: ['COMPLETED', 'CANCELLED'] },
            completedAt: { lt: weekAgo },
          },
        });
        result = { cleaned: true };
        break;
      }
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }

    await completeJob(job.id);
    return { success: true, result };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown execution error';
    await failJob(job.id, errorMsg, job.attempts, job.maxAttempts);
    return { success: false, error: errorMsg };
  }
}

/**
 * Runs one worker tick: claims and processes up to N pending jobs
 */
export async function runJobWorkerTick(maxJobs = 3): Promise<{ processed: number; completed: number; failed: number }> {
  let processed = 0;
  let completed = 0;
  let failed = 0;

  for (let i = 0; i < maxJobs; i++) {
    const job = await claimNextJob();
    if (!job) break;

    processed++;
    const res = await processJob(job);
    if (res.success) completed++;
    else failed++;
  }

  return { processed, completed, failed };
}

/**
 * Returns queue backlog statistics for admin health monitoring
 */
export async function getQueueStats() {
  const [pending, processing, completed, failed] = await Promise.all([
    prisma.job.count({ where: { status: 'PENDING' } }),
    prisma.job.count({ where: { status: 'PROCESSING' } }),
    prisma.job.count({ where: { status: 'COMPLETED' } }),
    prisma.job.count({ where: { status: 'FAILED' } }),
  ]);

  return { pending, processing, completed, failed, total: pending + processing + completed + failed };
}
