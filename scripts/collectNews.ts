import { collectAllNews } from '../src/lib/news/collector';

async function main() {
  console.log('==================================================');
  console.log('THEBRIEF NEWS COLLECTION (MANUAL TRIGGER)');
  console.log('==================================================\n');

  try {
    const startTime = performance.now();
    
    const summary = await collectAllNews();
    
    const endTime = performance.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n==================================================');
    console.log('COLLECTION SUMMARY');
    console.log('==================================================');
    console.log(`Sources processed: ${summary.sourcesProcessed}`);
    console.log(`Successful:        ${summary.successfulSources}`);
    console.log(`Failed:            ${summary.failedSources}`);
    console.log(`Items discovered:  ${summary.itemsFound}`);
    console.log(`New items:         ${summary.newItems}`);
    console.log(`Duplicates:        ${summary.duplicates}`);
    console.log(`Duration:          ${durationSec} seconds`);
    console.log('==================================================');

    process.exit(0);
  } catch (error) {
    console.error('Fatal error during collection:', error);
    process.exit(1);
  }
}

main();
