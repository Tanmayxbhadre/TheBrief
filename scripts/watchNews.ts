import { runNewsCollectionJob } from '../src/lib/news/jobRunner';

const intervalMinutes = parseInt(process.env.INTERVAL_MINUTES || '15', 10);
const intervalMs = intervalMinutes * 60 * 1000;
let isStopping = false;
let timeoutHandle: NodeJS.Timeout | null = null;

console.log('==================================================');
console.log('THEBRIEF NEWS COLLECTION (DEVELOPMENT WATCH MODE)');
console.log(`Interval: Every ${intervalMinutes} minutes`);
console.log('Press Ctrl+C to exit cleanly.');
console.log('==================================================\n');

async function tick() {
  if (isStopping) return;

  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  console.log(`[${timestamp}] Starting scheduled collection cycle...`);

  try {
    const result = await runNewsCollectionJob({ trigger: 'watch' });

    if (result.skipped) {
      console.log(`[${timestamp}] Cycle skipped: ${result.reason}`);
    } else {
      console.log(
        `[${timestamp}] Cycle [${result.status}]: ${result.newItems} new, ${result.duplicates} duplicates from ${result.sourcesProcessed} sources (${result.durationMs}ms)`
      );
    }
  } catch (error) {
    console.error(`[${timestamp}] Error during watch cycle:`, error);
  }

  if (!isStopping) {
    console.log(`Next collection in ${intervalMinutes} minutes...\n`);
    timeoutHandle = setTimeout(tick, intervalMs);
  }
}

// Graceful exit handlers
function shutdown() {
  if (isStopping) return;
  isStopping = true;
  console.log('\n[WATCH] Stopping news watch worker gracefully...');
  if (timeoutHandle) {
    clearTimeout(timeoutHandle);
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Run initial tick immediately
tick();
