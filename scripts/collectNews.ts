import { runNewsCollectionJob } from '../src/lib/news/jobRunner';

async function main() {
  console.log('==================================================');
  console.log('THEBRIEF NEWS COLLECTION (MANUAL CLI TRIGGER)');
  console.log('==================================================\n');

  try {
    const result = await runNewsCollectionJob({ trigger: 'cli' });

    if (result.skipped) {
      console.log(`[SKIPPED] ${result.reason || 'Job lock active'}`);
      process.exit(0);
    }

    const durationSec = (result.durationMs / 1000).toFixed(2);

    console.log('\n==================================================');
    console.log(`COLLECTION SUMMARY [${result.status}]`);
    console.log('==================================================');
    console.log(`Job ID:            ${result.jobId || 'N/A'}`);
    console.log(`Sources processed: ${result.sourcesProcessed}`);
    console.log(`Successful:        ${result.sourcesProcessed - result.failedSources}`);
    console.log(`Failed:            ${result.failedSources}`);
    console.log(`Items found:       ${result.itemsFound}`);
    console.log(`New items:         ${result.newItems}`);
    console.log(`Duplicates:        ${result.duplicates}`);
    console.log(`Duration:          ${durationSec}s`);
    console.log('==================================================');

    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error during collection job:', error);
    process.exit(1);
  }
}

main();
