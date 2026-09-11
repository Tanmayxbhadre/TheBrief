import { runNewsCollectionJob } from '../src/lib/news/jobRunner';
import { clusterUnassignedNewsItems } from '../src/lib/news/clustering';
import { runArticleGenerationWorker } from '../src/lib/ai/articleGenerationWorker';
import { runAutoPublishWorker } from '../src/lib/ai/autoPublishWorker';
import { prisma } from '../src/lib/db';

async function main() {
  console.log('=== STEP 1: Collection ===');
  const collectResult = await runNewsCollectionJob({ trigger: 'manual' });
  console.log(JSON.stringify(collectResult, null, 2));

  console.log('\n=== STEP 2: Clustering ===');
  const clusterResult = await clusterUnassignedNewsItems();
  console.log(JSON.stringify(clusterResult, null, 2));

  console.log('\n=== STEP 3: AI Article Generation ===');
  const aiResult = await runArticleGenerationWorker();
  console.log(JSON.stringify(aiResult, null, 2));

  console.log('\n=== STEP 4: Auto-Publish Sweep ===');
  const publishResult = await runAutoPublishWorker(20);
  console.log(JSON.stringify(publishResult, null, 2));

  console.log('\n=== FINAL DB STATE ===');
  const publishedCount = await prisma.articleDraft.count({ where: { status: 'PUBLISHED' } });
  const autoPublishedCount = await prisma.articleDraft.count({ where: { status: 'PUBLISHED', autoPublished: true } });
  const draftCount = await prisma.articleDraft.count({ where: { status: 'DRAFT' } });
  console.log(`Published total: ${publishedCount}, Auto-published total: ${autoPublishedCount}, Draft (needs review): ${draftCount}`);

  const recentAutoPublished = await prisma.articleDraft.findMany({
    where: { autoPublished: true },
    orderBy: { publishedAt: 'desc' },
    take: 5,
    select: { title: true, slug: true, publishConfidence: true, aiQualityScore: true, aiProvider: true, category: { select: { slug: true } } },
  });
  console.log('\nRecent auto-published articles:');
  console.log(JSON.stringify(recentAutoPublished, null, 2));

  process.exit(0);
}

main().catch((err) => {
  console.error('FATAL ERROR', err);
  process.exit(1);
});
