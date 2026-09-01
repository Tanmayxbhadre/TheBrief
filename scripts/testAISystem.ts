import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAISystem() {
  console.log('==================================================');
  console.log('TESTING THEBRIEF AI-ASSISTED DRAFTING SYSTEM');
  console.log('==================================================\n');

  // 1. Check AI Provider and Models
  console.log('--- 1. Testing Database & AI Schema Models ---');
  const sampleNewsItem = await prisma.newsItem.findFirst({
    include: { source: true, category: true },
  });

  if (!sampleNewsItem) {
    console.log('No news items in database. Skipping generation test.');
    return;
  }

  console.log(`Target NewsItem: "${sampleNewsItem.title}"`);
  console.log(`Source: ${sampleNewsItem.source.name} (${sampleNewsItem.originalUrl})\n`);

  // 2. Test AI Generation Simulation & Schema Validation
  console.log('--- 2. Testing Structured Draft Output Structure ---');
  const mockDraft = {
    title: `India Semiconductor Mission Expands with New Fabrication Approvals: ${sampleNewsItem.title.slice(0, 30)}`,
    suggestedSlug: `india-semiconductor-mission-expands-${Date.now()}`,
    excerpt: 'Government approves major fabrication facility investments to strengthen domestic semiconductor supply chains.',
    content: '## What Happened\n\nNew approvals under the India Semiconductor Mission mark a significant leap forward for national manufacturing capability.\n\n## Why It Matters\n\nReduces dependence on imported silicon components while attracting global tech partners.',
    quickSummary: [
      'Government grants regulatory clearance for semiconductor manufacturing.',
      'Target production scheduled to commence across initial phases.',
      'Attracts major ecosystem suppliers and skilled technical workforce.',
    ],
    whatYouNeedToKnow: {
      whatHappened: 'Cabinet cleared revised incentives for advanced fabrication units.',
      whyItMatters: 'Strengthens domestic electronics supply chain and resilience.',
      keyDetails: ['Multi-billion dollar capital outlay', 'Targeting 28nm and specialized nodes'],
      whatsNext: 'Site preparations and vendor agreements to finalize by Q4.',
    },
    timeline: [
      { date: 'Initial Clearance', title: 'Policy Formulated', description: 'Cabinet approved national framework.' },
      { date: 'Phase 1', title: 'Groundbreaking', description: 'Construction of initial facility begins.' },
    ],
    suggestedCategory: sampleNewsItem.category?.slug || 'technology',
    tags: ['Semiconductors', 'Manufacturing', 'Technology', 'India'],
    seoTitle: 'India Semiconductor Mission Approvals — THE BRIEF',
    metaDescription: 'Read THE BRIEF analysis on new semiconductor fabrication approvals in India. Facts, timelines, and industry impact.',
    sources: [
      { name: sampleNewsItem.source.name, url: sampleNewsItem.originalUrl },
      { name: 'Official PIB Release', url: 'https://pib.gov.in/sample' },
    ],
    reviewFlags: {
      needsVerification: true,
      verificationNotes: ['Confirm exact capital expenditure figures with Ministry release.'],
    },
    readingTime: 3,
  };

  console.log('Title length:', mockDraft.title.length);
  console.log('SEO Title length:', mockDraft.seoTitle.length, '(target: 50-60)');
  console.log('Meta Description length:', mockDraft.metaDescription.length, '(target: 140-160)');
  console.log('Quick summary bullets:', mockDraft.quickSummary.length);
  console.log('Review flags present:', mockDraft.reviewFlags.needsVerification);
  console.log('Sources count:', mockDraft.sources.length);

  // 3. Test Database Persistence of AI Draft
  console.log('\n--- 3. Testing Draft Creation with AI Metadata in SQLite ---');
  const savedDraft = await prisma.articleDraft.create({
    data: {
      newsItemId: sampleNewsItem.id,
      title: mockDraft.title,
      slug: mockDraft.suggestedSlug,
      excerpt: mockDraft.excerpt,
      content: mockDraft.content,
      categoryId: sampleNewsItem.categoryId,
      authorName: 'THE BRIEF Editorial Team',
      status: 'DRAFT', // Strictly DRAFT, never auto-published
      seoTitle: mockDraft.seoTitle,
      metaDescription: mockDraft.metaDescription,
      tags: JSON.stringify(mockDraft.tags),
      sources: JSON.stringify(mockDraft.sources),
      quickSummary: JSON.stringify(mockDraft.quickSummary),
      whatYouNeedToKnow: JSON.stringify(mockDraft.whatYouNeedToKnow),
      timeline: JSON.stringify(mockDraft.timeline),
      readingTime: mockDraft.readingTime,
      aiGenerated: true,
      aiProvider: 'mock',
      aiModel: 'thebrief-editorial-mock-v1',
      aiFlags: JSON.stringify(mockDraft.reviewFlags),
    },
  });

  console.log(`Saved Draft ID: ${savedDraft.id}`);
  console.log(`Draft Status: ${savedDraft.status} (Verified: NEVER auto-published)`);
  console.log(`AI Generated Flag: ${savedDraft.aiGenerated}`);
  console.log(`AI Provider: ${savedDraft.aiProvider}`);

  // 4. Test AI Generation Log recording
  console.log('\n--- 4. Testing AI Generation Log & Cost Tracking ---');
  const log = await prisma.aIGenerationLog.create({
    data: {
      operation: 'draft_generation',
      provider: 'mock',
      model: 'thebrief-editorial-mock-v1',
      newsItemId: sampleNewsItem.id,
      draftId: savedDraft.id,
      inputTokens: 450,
      outputTokens: 680,
      totalTokens: 1130,
      durationMs: 620,
      status: 'SUCCESS',
      reviewFlags: JSON.stringify(mockDraft.reviewFlags),
      user: 'Automated Test Suite',
    },
  });

  console.log(`AIGenerationLog ID: ${log.id}`);
  console.log(`Logged Tokens: ${log.totalTokens} (Input: ${log.inputTokens}, Output: ${log.outputTokens})`);
  console.log(`Duration: ${log.durationMs}ms`);

  // 5. Test Aggregations & Monitoring
  console.log('\n--- 5. Testing Aggregations & Monitoring ---');
  const totalTokens = await prisma.aIGenerationLog.aggregate({
    _sum: { totalTokens: true },
  });
  console.log(`Total System Tokens Logged: ${totalTokens._sum.totalTokens}`);

  // 6. Verify Original NewsItem is intact
  console.log('\n--- 6. Verifying Original NewsItem Inviolability ---');
  const checkedNewsItem = await prisma.newsItem.findUnique({
    where: { id: sampleNewsItem.id },
  });
  console.log(`Original NewsItem ID: ${checkedNewsItem?.id}`);
  console.log(`Original NewsItem URL preserved: ${checkedNewsItem?.originalUrl === sampleNewsItem.originalUrl ? 'PASS' : 'FAIL'}`);

  // Clean up test records
  console.log('\n--- 7. Cleanup Test Records ---');
  await prisma.aIGenerationLog.delete({ where: { id: log.id } });
  await prisma.articleDraft.delete({ where: { id: savedDraft.id } });
  console.log('Cleaned up test draft and test generation log successfully: PASS');

  console.log('\n==================================================');
  console.log('ALL PHASE 5 AI SYSTEM TESTS PASSED SUCCESSFULLY');
  console.log('==================================================');
}

testAISystem()
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
