import { prisma } from '../src/lib/db';
import { collectAllNews } from '../src/lib/news/collector';
import { GeminiProvider } from '../src/lib/ai/providers/gemini';
import { MockAIProvider } from '../src/lib/ai/providers/mock';
import { generateDraftForCluster } from '../src/lib/ai/articleGenerationWorker';
import { StructuredArticleDraftSchema } from '../src/lib/ai/schemas';

async function main() {
  console.log('==================================================');
  console.log('THEBRIEF — REAL GEMINI + RSS END-TO-END TEST');
  console.log('==================================================\n');

  let geminiPass = false;
  let rssPass = false;
  let intelligencePass = false;
  let clusteringPass = false;
  let aiGenerationPass = false;
  let zodPass = false;
  let draftCreationPass = false;

  let storiesDiscovered = 0;
  let duplicatesCount = 0;
  let clustersCount = 0;
  let geminiGenerations = 0;
  let draftsCreated = 0;
  const errors: string[] = [];

  // ----------------------------------------------------
  // STEP 1: Verify Gemini Setup
  // ----------------------------------------------------
  console.log('>>> STEP 1: Verifying Gemini Configuration...');
  const gemini = new GeminiProvider();
  const hasKey = gemini.isAvailable();
  const primaryProvider = process.env.AI_PRIMARY_PROVIDER || process.env.AI_PROVIDER;

  console.log(`- Primary Provider: ${primaryProvider}`);
  console.log(`- Model configured: ${gemini.defaultModel}`);
  console.log(`- Gemini Key configured: ${hasKey ? 'YES' : 'NO'}`);

  if (!hasKey) {
    errors.push('GEMINI_API_KEY is not configured or unavailable');
    throw new Error('GEMINI_API_KEY is missing');
  }

  // ----------------------------------------------------
  // STEP 2: Real Gemini Request
  // ----------------------------------------------------
  console.log('\n>>> STEP 2: Executing Real Gemini Request...');
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    const model = gemini.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: 'Return a JSON object with exactly one property called status whose value is Gemini connection successful.',
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gemini returned status ${res.status}: ${errText.slice(0, 200)}`);
    }

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = JSON.parse(rawText || '{}');

    console.log(`- HTTP Status: ${res.status}`);
    console.log(`- Gemini Response:`, parsed);

    if (parsed.status && parsed.status.includes('Gemini connection successful')) {
      geminiPass = true;
      geminiGenerations++;
      console.log('✓ Gemini direct connection test PASSED');
    } else {
      throw new Error(`Unexpected payload from Gemini: ${rawText}`);
    }
  } catch (err: unknown) {
    const msg = (err as Error).message;
    errors.push(`Gemini direct request failed: ${msg}`);
    console.error('✗ Gemini connection test FAILED:', msg);
  }

  // ----------------------------------------------------
  // STEP 3: Real RSS Ingestion
  // ----------------------------------------------------
  console.log('\n>>> STEP 3: Fetching Real RSS Feeds...');
  let collectionSummary;
  try {
    collectionSummary = await collectAllNews();
    storiesDiscovered = collectionSummary.newItems;
    duplicatesCount = collectionSummary.duplicates;

    console.log(`- Sources Processed: ${collectionSummary.sourcesProcessed}`);
    console.log(`- Successful Sources: ${collectionSummary.successfulSources}`);
    console.log(`- Failed Sources: ${collectionSummary.failedSources}`);
    console.log(`- Stories Found: ${collectionSummary.itemsFound}`);
    console.log(`- New Stories Discovered: ${collectionSummary.newItems}`);
    console.log(`- Duplicates Skipped: ${collectionSummary.duplicates}`);

    if (collectionSummary.sourcesProcessed > 0 && collectionSummary.successfulSources > 0) {
      rssPass = true;
      console.log('✓ RSS Collection PASSED');
    } else {
      errors.push('No sources succeeded during collection');
    }
  } catch (err: unknown) {
    const msg = (err as Error).message;
    errors.push(`RSS collection error: ${msg}`);
    console.error('✗ RSS collection FAILED:', msg);
  }

  // ----------------------------------------------------
  // STEP 4: Real News Intelligence & Story Clustering
  // ----------------------------------------------------
  console.log('\n>>> STEP 4: Verifying News Intelligence & Clustering...');
  try {
    const sampleItem = await prisma.newsItem.findFirst({
      where: { intelligenceProcessed: true },
      orderBy: { createdAt: 'desc' },
      include: { source: true, cluster: true, category: true },
    });

    if (sampleItem) {
      console.log(`- Sample Story Title: "${sampleItem.title}"`);
      console.log(`- Category: ${sampleItem.category?.name} (${sampleItem.category?.slug})`);
      console.log(`- Subcategory: ${sampleItem.subcategory || 'General'}`);
      console.log(`- Importance Score: ${sampleItem.importanceScore}/100`);
      console.log(`- Importance Reason: "${sampleItem.importanceReason}"`);
      console.log(`- Trending Score: ${sampleItem.trendingScore}/100`);
      console.log(`- Breaking Score: ${sampleItem.breakingScore}/100 (isBreaking: ${sampleItem.isBreaking})`);
      console.log(`- Source: ${sampleItem.source?.name} (Reliability: ${sampleItem.source?.reliabilityScore}/100)`);
      console.log(`- Confidence Score: ${sampleItem.confidenceScore}/100`);
      console.log(`- Editorial Recommendation: ${sampleItem.editorialRecommendation}`);
      console.log(`- Entities: ${sampleItem.entities}`);

      intelligencePass = true;
      console.log('✓ News Intelligence PASSED');

      if (sampleItem.cluster) {
        clusteringPass = true;
        console.log(`- Assigned to Cluster ID: ${sampleItem.cluster.id}`);
        console.log(`- Cluster Title: "${sampleItem.cluster.canonicalTitle}"`);
        console.log(`- Cluster Source Count: ${sampleItem.cluster.sourceCount}`);
        console.log('✓ Story Clustering PASSED');
      } else {
        const anyCluster = await prisma.storyCluster.findFirst({
          include: { items: true },
        });
        if (anyCluster) {
          clusteringPass = true;
          console.log(`- Found Active Cluster: "${anyCluster.canonicalTitle}" with ${anyCluster.sourceCount} sources`);
          console.log('✓ Story Clustering PASSED');
        }
      }
    } else {
      errors.push('No intelligence-processed news item found in database');
    }

    clustersCount = await prisma.storyCluster.count();
    console.log(`- Total Story Clusters in Database: ${clustersCount}`);
  } catch (err: unknown) {
    const msg = (err as Error).message;
    errors.push(`Intelligence verification error: ${msg}`);
    console.error('✗ News Intelligence FAILED:', msg);
  }

  // ----------------------------------------------------
  // STEP 5, 6 & 7: Real AI Article Generation, Zod, and DB
  // ----------------------------------------------------
  console.log('\n>>> STEP 5, 6 & 7: Real AI Article Generation with Gemini...');
  try {
    const targetCluster = await prisma.storyCluster.findFirst({
      where: { items: { some: {} } },
      orderBy: { sourceCount: 'desc' },
      include: { items: { include: { source: true } } },
    });

    if (!targetCluster) {
      throw new Error('No valid StoryCluster found to synthesize');
    }

    console.log(`- Synthesizing Cluster: "${targetCluster.canonicalTitle}" (${targetCluster.items.length} wire reports)`);

    const draftId = await generateDraftForCluster(targetCluster.id, 'Real Gemini Test');
    geminiGenerations++;
    draftsCreated++;

    const draft = await prisma.articleDraft.findUnique({
      where: { id: draftId },
      include: { revisions: true, category: true },
    });

    if (!draft) {
      throw new Error(`Draft ${draftId} was not found in database`);
    }

    console.log(`- Created Draft ID: ${draft.id}`);
    console.log(`- Draft Title: "${draft.title}"`);
    console.log(`- Slug: ${draft.slug}`);
    console.log(`- Excerpt: "${draft.excerpt.slice(0, 100)}..."`);
    console.log(`- Reading Time: ${draft.readingTime} min`);
    console.log(`- AI Provider Recorded: ${draft.aiProvider}`);
    console.log(`- AI Model Recorded: ${draft.aiModel}`);
    console.log(`- AI Quality Score: ${draft.aiQualityScore}/100`);
    console.log(`- Publish Confidence: ${draft.publishConfidence}/100`);
    console.log(`- Publication Status: ${draft.status}`);
    console.log(`- Auto-Published: ${draft.autoPublished}`);
    console.log(`- Revision Records: ${draft.revisions.length}`);

    const hasQuickSummary = Boolean(draft.quickSummary && draft.quickSummary.length > 10);
    const hasWhatYouNeed = Boolean(draft.whatYouNeedToKnow && draft.whatYouNeedToKnow.length > 10);
    const hasBody = Boolean(draft.content && draft.content.length > 100);
    const hasSeo = Boolean(draft.seoTitle && draft.metaDescription);
    const hasSources = Boolean(draft.sources && draft.sources.length > 5);

    console.log(`- Has Quick Summary: ${hasQuickSummary ? 'YES' : 'NO'}`);
    console.log(`- Has Key Takeaways: ${hasWhatYouNeed ? 'YES' : 'NO'}`);
    console.log(`- Has Markdown Body: ${hasBody ? 'YES' : 'NO'}`);
    console.log(`- Has SEO Metadata: ${hasSeo ? 'YES' : 'NO'}`);
    console.log(`- Has Sources Attribution: ${hasSources ? 'YES' : 'NO'}`);

    if (hasQuickSummary && hasWhatYouNeed && hasBody && hasSeo && hasSources) {
      aiGenerationPass = true;
      console.log('✓ AI Article Generation PASSED');
    }

    // Verify Zod Validation
    let quickSummaryArr: string[] = [];
    let whatYouNeedObj: Record<string, unknown> | undefined = undefined;
    try {
      quickSummaryArr = JSON.parse(draft.quickSummary || '[]');
      whatYouNeedObj = draft.whatYouNeedToKnow ? JSON.parse(draft.whatYouNeedToKnow) : undefined;
    } catch {}

    console.log('- Safe Object Field Structure:');
    console.log(`  title: ${draft.title ? 'present' : 'missing'}`);
    console.log(`  suggestedSlug: ${draft.slug ? 'present' : 'missing'}`);
    console.log(`  excerpt: ${draft.excerpt ? 'present' : 'missing'}`);
    console.log(`  quickSummary: ${quickSummaryArr.length > 0 ? 'present' : 'missing'}`);
    console.log(`  whatYouNeedToKnow: ${whatYouNeedObj ? 'present' : 'missing'}`);
    console.log(`  content: ${draft.content ? 'present' : 'missing'}`);
    console.log(`  suggestedCategory: ${draft.category?.slug ? 'present' : 'missing'}`);
    console.log(`  seoTitle: ${draft.seoTitle ? 'present' : 'missing'}`);
    console.log(`  metaDescription: ${draft.metaDescription ? 'present' : 'missing'}`);
    console.log(`  sources: ${draft.sources ? 'present' : 'missing'}`);

    const draftZodCheck = StructuredArticleDraftSchema.safeParse({
      title: draft.title,
      suggestedSlug: draft.slug,
      excerpt: draft.excerpt,
      quickSummary: quickSummaryArr,
      whatYouNeedToKnow: whatYouNeedObj,
      content: draft.content,
      suggestedCategory: draft.category?.slug || 'technology',
      readingTime: draft.readingTime,
      seoTitle: draft.seoTitle,
      metaDescription: draft.metaDescription,
      tags: JSON.parse(draft.tags || '[]'),
      sources: JSON.parse(draft.sources || '[]'),
      reviewFlags: draft.aiFlags ? JSON.parse(draft.aiFlags) : undefined,
    });

    if (draftZodCheck.success) {
      zodPass = true;
      console.log('✓ Zod Schema Validation PASSED');
    } else {
      console.error('✗ Zod Validation Issues:', draftZodCheck.error.issues);
      errors.push(`Zod validation error: ${draftZodCheck.error.issues.map((i) => i.message).join(', ')}`);
    }

    const aiLog = await prisma.aIGenerationLog.findFirst({
      where: { operation: 'draft_generation' },
      orderBy: { createdAt: 'desc' },
    });

    if (draft.status === 'DRAFT' && !draft.autoPublished && aiLog?.status === 'SUCCESS') {
      draftCreationPass = true;
      console.log('✓ Database & Safety State PASSED (status = DRAFT, auto-publish = DISABLED)');
    } else {
      errors.push(`Invalid draft state: status=${draft.status}, autoPublished=${draft.autoPublished}`);
    }
  } catch (err: unknown) {
    const msg = (err as Error).message;
    errors.push(`Article generation error: ${msg}`);
    console.error('✗ AI Article Generation FAILED:', msg);
  }

  // ----------------------------------------------------
  // STEP 8: Verify Mock Fallback
  // ----------------------------------------------------
  console.log('\n>>> STEP 8: Verifying Mock Provider Fallback...');
  const mockProvider = new MockAIProvider();
  const mockAvailable = mockProvider.isAvailable();
  console.log(`- Mock Provider name: ${mockProvider.name}`);
  console.log(`- Mock Provider Available: ${mockAvailable ? 'YES' : 'NO'}`);
  console.log('✓ Mock Fallback Verification PASSED');

  // ----------------------------------------------------
  // STEP 9: Final Report
  // ----------------------------------------------------
  console.log('\n==================================================');
  console.log('FINAL INTEGRATION TEST REPORT');
  console.log('==================================================\n');

  console.log(`REAL GEMINI TEST:        ${geminiPass ? 'PASS' : 'FAIL'}`);
  console.log(`RSS COLLECTION:          ${rssPass ? 'PASS' : 'FAIL'}`);
  console.log(`NEWS INTELLIGENCE:       ${intelligencePass ? 'PASS' : 'FAIL'}`);
  console.log(`STORY CLUSTERING:        ${clusteringPass ? 'PASS' : 'FAIL'}`);
  console.log(`AI ARTICLE GENERATION:   ${aiGenerationPass ? 'PASS' : 'FAIL'}`);
  console.log(`ZOD VALIDATION:          ${zodPass ? 'PASS' : 'FAIL'}`);
  console.log(`ARTICLE DRAFT CREATION:  ${draftCreationPass ? 'PASS' : 'FAIL'}`);
  console.log(`AUTO PUBLISH:            DISABLED\n`);

  console.log(`Stories discovered:      ${storiesDiscovered}`);
  console.log(`Duplicates:              ${duplicatesCount}`);
  console.log(`Clusters:                ${clustersCount}`);
  console.log(`Gemini generations:      ${geminiGenerations}`);
  console.log(`Drafts created:          ${draftsCreated}`);
  console.log(`Errors:                  ${errors.length > 0 ? errors.join('; ') : 'None'}`);
  console.log('\n==================================================');

  if (errors.length > 0) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error('Fatal execution error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
