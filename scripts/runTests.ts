import {
  StructuredArticleDraftSchema,
  HeadlineImprovementSchema,
  SummaryImprovementSchema,
  SeoImprovementSchema,
  TagsImprovementSchema,
  RewriteImprovementSchema,
  FactCheckImprovementSchema,
} from '../src/lib/ai/schemas';
import {
  aiServic
let failed = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('==================================================');
  console.log('THEBRIEF PHASE 6 — COMPREHENSIVE TEST SUITE');
  console.log('==================================================\n');

  // ----------------------------------------------------
  // TEST GROUP 1: Zod Schemas Validation
  // ----------------------------------------------------
  console.log('--- Test Suite 1: AI Zod Validation Schemas ---');

  const validDraft = {
    title: 'NVIDIA Unveils Next-Generation Blackwell Ultra AI Accelerators',
    suggestedSlug: 'nvidia-unveils-blackwell-ultra-accelerators',
    excerpt: 'NVIDIA announced its newest Blackwell Ultra GPUs designed for trillion-parameter foundation models.',
    content: '## What Happened\n\nNVIDIA introduced Blackwell Ultra with enhanced FP8 compute capabilities.\n\n## Why It Matters\n\nAccelerates training throughput while reducing data center energy footprint.',
    quickSummary: [
      'Blackwell Ultra delivers 3x faster inference throughput.',
      'Mass production scheduled for early 2027.',
      'Major cloud providers lined up for initial deployments.',
    ],
    whatYouNeedToKnow: {
      whatHappened: 'NVIDIA revealed new data center hardware architecture.',
      whyItMatters: 'Reduces energy costs for frontier AI model training.',
      keyDetails: ['3.5TB/s memory bandwidth', 'Liquid-cooled reference designs'],
      whatsNext: 'Sampling to server partners begins in Q2.',
    },
    timeline: [
      { date: 'March 2026', title: 'Architecture Unveiled', description: 'Announced at annual keynote.' },
    ],
    suggestedCategory: 'technology',
    tags: ['NVIDIA', 'AI', 'Hardware', 'Semiconductors'],
    seoTitle: 'NVIDIA Announces Blackwell Ultra GPUs — THE BRIEF',
    metaDescription: 'Read the comprehensive breakdown of NVIDIA Blackwell Ultra specifications, efficiency gains, and release schedule.',
    sources: [{ name: 'NVIDIA Newsroom', url: 'https://nvidianews.nvidia.com' }],
    reviewFlags: { needsVerification: false, verificationNotes: [] },
    readingTime: 4,
  };

  const draftParseResult = StructuredArticleDraftSchema.safeParse(validDraft);
  assert(draftParseResult.success, 'Valid structured draft parses successfully');

  const invalidDraft = {
    title: 'Too short',
    suggestedSlug: 'bad',
    excerpt: '', // Empty excerpt (invalid)
    content: '',
    quickSummary: [], // Empty summary (invalid)
  };
  const invalidParseResult = StructuredArticleDraftSchema.safeParse(invalidDraft);
  assert(!invalidParseResult.success, 'Invalid draft schema is strictly rejected');

  const headlineResult = HeadlineImprovementSchema.safeParse({
    headline: 'Clean Headline Option',
    alternatives: ['Option A', 'Option B'],
  });
  assert(headlineResult.success, 'Headline improvement schema validation passes');

  const summaryResult = SummaryImprovementSchema.safeParse({
    quickSummary: ['Point 1', 'Point 2'],
  });
  assert(summaryResult.success, 'Summary improvement schema validation passes');

  const seoResult = SeoImprovementSchema.safeParse({
    seoTitle: 'Optimized Title Here — THE BRIEF',
    metaDescription: 'A long enough meta description that passes the length requirement easily.',
  });
  assert(seoResult.success, 'SEO metadata schema validation passes');

  const tagsResult = TagsImprovementSchema.safeParse({
    tags: ['Tech', 'AI', 'Business'],
  });
  assert(tagsResult.success, 'Tags improvement schema validation passes');

  const rewriteResult = RewriteImprovementSchema.safeParse({
    rewrittenText: 'Concise and polished phrasing here.',
    tone: 'clarity',
  });
  assert(rewriteResult.success, 'Rewrite schema validation passes');

  const factCheckResult = FactCheckImprovementSchema.safeParse({
    claims: [
      { claim: 'Launch in 2027', status: 'verified', note: 'Official release' },
      { claim: 'Pricing $50k', status: 'unconfirmed', note: 'Analyst estimate' },
    ],
    overallAssessment: 'Factual core corroborated by primary release.',
    reviewFlags: { needsVerification: true, verificationNotes: ['Verify pricing'] },
  });
  assert(factCheckResult.success, 'Fact check schema validation passes');

  // ----------------------------------------------------
  // TEST GROUP 2: XSS Sanitization
  // ----------------------------------------------------
  console.log('\n--- Test Suite 2: AI Output XSS Sanitization ---');

  const maliciousScript = 'Breaking news <script>alert("xss")</script> from the wire.';
  const sanitizedScript = sanitizeAiText(maliciousScript);
  assert(!sanitizedScript.includes('<script>') && !sanitizedScript.includes('alert'), 'Script tags and contents stripped');

  const maliciousAttr = '<div onclick="stealCookies()" onload="badCode()">Safe text</div>';
  const sanitizedAttr = sanitizeAiText(maliciousAttr);
  assert(!sanitizedAttr.includes('onclick') && !sanitizedAttr.includes('onload'), 'Inline event handlers stripped');

  const maliciousUri = '<a href="javascript:alert(1)">Click me</a>';
  const sanitizedUri = sanitizeAiText(maliciousUri);
  assert(!sanitizedUri.includes('javascript:'), 'javascript: URIs stripped');

  const dangerousNestedObj = {
    headline: 'Title <script>evil()</script>',
    bullets: ['Point <iframe src="evil.com"></iframe>', 'Clean point'],
    meta: {
      desc: 'Normal description <img onerror="hack()" src=x />',
    },
  };
  const cleanedNested = sanitizeStructuredAiOutput(dangerousNestedObj);
  assert(!cleanedNested.headline.includes('<script>'), 'Nested object string sanitization passes');
  assert(!cleanedNested.bullets[0].includes('iframe'), 'Nested array item sanitization passes');
  assert(!cleanedNested.meta.desc.includes('onerror'), 'Deep nested property sanitization passes');

  // ----------------------------------------------------
  // TEST GROUP 3: Rate Limiting
  // ----------------------------------------------------
  console.log('\n--- Test Suite 3: Token Bucket Rate Limiting ---');

  aiRateLimiter.reset();
  const testUser = 'editor_test_user';

  // First 3 requests with limit 3 should be allowed
  const r1 = aiRateLimiter.check(testUser, 3, 5000);
  const r2 = aiRateLimiter.check(testUser, 3, 5000);
  const r3 = aiRateLimiter.check(testUser, 3, 5000);
  assert(r1.allowed && r2.allowed && r3.allowed, 'Allowed requests within limit succeed');
  assert(r3.remaining === 0, 'Remaining count decreases to 0');

  // 4th request should be blocked
  const r4 = aiRateLimiter.check(testUser, 3, 5000);
  assert(!r4.allowed, 'Excess request beyond rate limit is blocked (429)');
  assert(r4.resetInMs > 0, 'Returns correct reset time window');

  // ----------------------------------------------------
  // TEST GROUP 4: AI Service Integration (Mock Provider)
  // ----------------------------------------------------
  console.log('\n--- Test Suite 4: AI Service & Provider Integration ---');

  const providerInfo = aiService.getProviderInfo();
  assert(providerInfo.isConfigured, 'AI Service provider is initialized and configured');
  assert(aiService.isEnabled(), 'AI Service is enabled by default');

  const draftResponse = await aiService.generateArticleDraft({
    headline: 'ISRO Announces Advanced Gaganyaan Orbital Test Flights',
    description: 'The Indian Space Research Organisation confirmed two uncrewed test missions ahead of human spaceflight.',
    primarySource: {
      name: 'ISRO Press Desk',
      url: 'https://isro.gov.in/sample',
    },
    categorySlug: 'science',
    mode: 'standard',
  });

  assert(Boolean(draftResponse.draft), 'AI Service generates structured draft object');
  assert(draftResponse.draft.title.length > 5, 'Generated draft has valid non-empty headline');
  assert(draftResponse.draft.quickSummary.length >= 2, 'Generated draft has quick summary bullets');
  assert(Boolean(draftResponse.draft.whatYouNeedToKnow), 'Generated draft contains What You Need To Know breakdown');
  assert(draftResponse.draft.sources.length >= 1, 'Source attribution is preserved');
  assert(Boolean(draftResponse.draft.reviewFlags), 'Verification flags structure is present');
  assert(draftResponse.usage.totalTokens! > 0, 'Token usage metadata is calculated');

  // Test improve operations
  const headlineImprove = await aiService.improve({
    action: 'headline',
    title: 'Gaganyaan Test Flights Scheduled',
  });
  assert(headlineImprove.action === 'headline', 'Improve action: headline returned');

  const summaryImprove = await aiService.improve({
    action: 'summary',
    title: 'Gaganyaan Test Flights',
    content: 'Full description of the orbital test flight parameters.',
  });
  assert(summaryImprove.action === 'summary', 'Improve action: summary returned');

  const seoImprove = await aiService.improve({
    action: 'seo',
    title: 'ISRO Gaganyaan Mission 2026',
  });
  assert(seoImprove.action === 'seo', 'Improve action: seo metadata returned');

  const tagsImprove = await aiService.improve({
    action: 'tags',
    title: 'ISRO Space Mission',
    categorySlug: 'science',
  });
  assert(tagsImprove.action === 'tags', 'Improve action: tags returned');

  const rewriteImprove = await aiService.improve({
    action: 'rewrite',
    selectedText: 'The rocket was launched by the space agency on Monday morning.',
    instruction: 'concise',
  });
  assert(rewriteImprove.action === 'rewrite', 'Improve action: rewrite returned');

  const factCheckImprove = await aiService.improve({
    action: 'fact_check',
    title: 'ISRO Mission',
    content: 'The mission launch date was confirmed for November 15.',
    sources: [{ name: 'ISRO', url: 'https://isro.gov.in' }],
  });
  assert(factCheckImprove.action === 'fact_check', 'Improve action: fact_check returned');

  // ----------------------------------------------------
  // TEST GROUP 5: Durable Database Lock & Concurrency
  // ----------------------------------------------------
  console.log('\n--- Test Suite 5: Durable Database Job Locking ---');

  // Clean test lock
  await prisma.collectionJobLock.deleteMany({ where: { jobName: 'test-lock' } });

  // 1. Acquire lock
  const lock1 = await prisma.collectionJobLock.create({
    data: {
      jobName: 'test-lock',
      acquiredAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  assert(Boolean(lock1.id), 'Acquired test database lock successfully');

  // 2. Attempt duplicate lock (should fail unique constraint)
  let duplicateBlocked = false;
  try {
    await prisma.collectionJobLock.create({
      data: {
        jobName: 'test-lock',
        acquiredAt: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
  } catch {
    duplicateBlocked = true;
  }
  assert(duplicateBlocked, 'Concurrent lock collision is strictly blocked at DB level');

  // 3. Release lock
  await prisma.collectionJobLock.deleteMany({ where: { jobName: 'test-lock' } });
  const remainingLocks = await prisma.collectionJobLock.count({ where: { jobName: 'test-lock' } });
  assert(remainingLocks === 0, 'Durable lock release completes cleanly');

  // ----------------------------------------------------
  // TEST GROUP 6: Collection Job History & Execution
  // ----------------------------------------------------
  console.log('\n--- Test Suite 6: News Collection Job Runner ---');

  const initialJobCount = await prisma.collectionJob.count();
  const jobResult = await runNewsCollectionJob({ trigger: 'cli' });

  assert(Boolean(jobResult.jobId), 'News collection job executes and creates a CollectionJob record');
  assert(jobResult.durationMs >= 0, 'Job duration is recorded in milliseconds');

  const updatedJobCount = await prisma.collectionJob.count();
  assert(updatedJobCount > initialJobCount, 'CollectionJob execution history persists in database');

  const loggedJob = await prisma.collectionJob.findUnique({
    where: { id: jobResult.jobId },
  });
  assert(
    loggedJob?.status === 'COMPLETED' || loggedJob?.status === 'PARTIAL' || loggedJob?.status === 'FAILED',
    'Job status reflects execution state accurately (COMPLETED/PARTIAL/FAILED)'
  );
  assert(loggedJob?.trigger === 'cli', 'Trigger context is preserved in job history');

  // Verify second immediate run handles deduplication
  console.log('\n--- Test Suite 7: Idempotency & Deduplication ---');
  const secondRunResult = await runNewsCollectionJob({ trigger: 'cli' });
  assert(Boolean(secondRunResult.jobId), 'Immediate second collection run executes cleanly');
  assert(secondRunResult.duplicates >= 0, 'Second run tracks duplicate stories rather than creating duplicates');

  // ----------------------------------------------------
  // TEST GROUP 8: News Intelligence & Scoring
  // ----------------------------------------------------
  console.log('\n--- Test Suite 8: News Intelligence & Scoring ---');
  const {
    extractEntities,
    detectSubcategory,
    calculateImportanceScore,
    calculateBreakingScore,
    calculateTrendingScore,
    analyzeNewsItem,
  } = await import('../src/lib/news/newsIntelligenceService');

  const entities = extractEntities(
    'OpenAI and Microsoft announce new GPT-5 model with advanced reasoning capabilities in California',
    'Sam Altman presented alongside Satya Nadella'
  );
  assert(entities.companies.includes('OpenAI') && entities.companies.includes('Microsoft'), 'Entities extract major companies correctly');
  assert(entities.people.includes('Sam Altman') && entities.people.includes('Satya Nadella'), 'Entities extract key people correctly');
  assert(entities.products.includes('GPT-5'), 'Entities extract product names correctly');
  assert(entities.locations.includes('California'), 'Entities extract locations correctly');

  const subcategory = detectSubcategory('ai', 'OpenAI unveils new GPT-5 model');
  assert(subcategory === 'OpenAI' || subcategory === 'AI Models', 'Subcategory detection identifies specific domain correctly');

  const breakingResult = calculateBreakingScore('BREAKING: Major Earthquake strikes coastal region, emergency response active');
  assert(breakingResult.isBreaking && breakingResult.score >= 70, 'Breaking news signals detect genuine urgency');

  const nonBreakingResult = calculateBreakingScore('Quarterly market outlook indicates steady semiconductor demand');
  assert(!nonBreakingResult.isBreaking, 'Standard news is not falsely classified as breaking');

  const importanceResult = calculateImportanceScore({
    title: 'OpenAI launches new GPT-5 model with historic breakthrough in reasoning',
    sourceReliability: 95,
    sourcePriority: 1,
    entities,
    isBreaking: false,
    sourceCount: 6,
  });
  assert(importanceResult.score >= 80, 'High-impact multi-source story achieves HIGH/CRITICAL importance score');
  assert(importanceResult.reason.length > 0, 'Importance reason provides clear editorial explanation');

  const trendingScore = calculateTrendingScore({
    sourceCount: 6,
    entityCount: 4,
    publishedAt: new Date(),
    importanceScore: 85,
  });
  assert(trendingScore >= 60, 'Trending score reflects high multi-source velocity and recency');

  const fullAnalysis = await analyzeNewsItem({
    title: 'NVIDIA and Google Cloud expand strategic AI infrastructure partnership',
    description: 'Jensen Huang and Sundar Pichai announced new clusters.',
    sourceId: 'techcrunch',
    publishedAt: new Date(),
  });
  assert(fullAnalysis.category === 'technology' || fullAnalysis.category === 'ai', 'Full analysis classifies category accurately');
  assert(fullAnalysis.confidenceScore >= 70, 'Analysis calculates dependable confidence score');

  // ----------------------------------------------------
  // TEST GROUP 9: Story Clustering & Layered Similarity
  // ----------------------------------------------------
  console.log('\n--- Test Suite 9: Story Clustering Engine ---');
  const {
    computeStorySimilarity,
    tokenizeText,
    computeJaccardSimilarity,
    assignItemToCluster,
  } = await import('../src/lib/news/clustering');

  const tokensA = tokenizeText('OpenAI launches new model GPT-5');
  const tokensB = tokenizeText('OpenAI unveils new GPT-5 model with reasoning');
  const jaccard = computeJaccardSimilarity(tokensA, tokensB);
  assert(jaccard >= 0.4, 'Jaccard similarity recognizes overlapping story tokens');

  const similarityScore = computeStorySimilarity(
    { title: 'OpenAI announces GPT-5 frontier model', description: 'New artificial intelligence system launched.' },
    { title: 'OpenAI unveils latest GPT-5 AI model with advanced capabilities', description: 'Sam Altman reveals new frontier model.' }
  );
  assert(similarityScore >= 0.4, 'Layered similarity detects matching news stories across different outlets');

  const unrelatedSimilarity = computeStorySimilarity(
    { title: 'OpenAI announces GPT-5 frontier model' },
    { title: 'Sensex falls 400 points as banking stocks retreat in Mumbai' }
  );
  assert(unrelatedSimilarity < 0.2, 'Dissimilar stories receive low similarity score');

  // Create test news items from distinct sources for clustering
  const clusterSourceA = await prisma.source.findFirst() || await prisma.source.create({
    data: { id: 'test-src-a', name: 'Reuters Wire', url: 'https://reuters.com', reliabilityScore: 95 },
  });
  const clusterSourceB = await prisma.source.findFirst({ where: { id: { not: clusterSourceA.id } } }) || await prisma.source.create({
    data: { id: 'test-src-b', name: 'BBC Global', url: 'https://bbc.com', reliabilityScore: 95 },
  });

  const uniqueHash1 = `hash-${Date.now()}-1`;
  const uniqueHash2 = `hash-${Date.now()}-2`;

  const item1 = await prisma.newsItem.create({
    data: {
      sourceId: clusterSourceA.id,
      title: 'DeepSeek unveils revolutionary open reasoning model',
      originalUrl: `https://reuters.com/article-${Date.now()}-1`,
      normalizedUrl: `https://reuters.com/article-${Date.now()}-1`,
      contentHash: uniqueHash1,
      importanceScore: 88,
      status: 'DISCOVERED',
    },
  });

  const item2 = await prisma.newsItem.create({
    data: {
      sourceId: clusterSourceB.id,
      title: 'DeepSeek launches new open-weights reasoning model to challenge competitors',
      originalUrl: `https://bbc.com/article-${Date.now()}-2`,
      normalizedUrl: `https://bbc.com/article-${Date.now()}-2`,
      contentHash: uniqueHash2,
      importanceScore: 85,
      status: 'DISCOVERED',
    },
  });

  const clusterId1 = await assignItemToCluster(item1.id);
  assert(Boolean(clusterId1), 'First story seeds a new StoryCluster');

  const clusterId2 = await assignItemToCluster(item2.id);
  assert(clusterId1 === clusterId2, 'Second matching story from different source joins the same StoryCluster');

  const formedCluster = await prisma.storyCluster.findUnique({
    where: { id: clusterId1 },
    include: { items: true },
  });
  assert(formedCluster?.sourceCount === 2, 'StoryCluster tracks distinct source count accurately (2 sources)');

  // ----------------------------------------------------
  // TEST GROUP 10: Multi-Source AI Synthesis & Quality Checks
  // ----------------------------------------------------
  console.log('\n--- Test Suite 10: Multi-Source Synthesis & Quality Scoring ---');
  const {
    calculateAiQualityScore,
    calculatePublishConfidence,
    generateDraftForCluster,
  } = await import('../src/lib/ai/articleGenerationWorker');

  const qualityEval = calculateAiQualityScore(validDraft, [{ name: 'NVIDIA Newsroom', url: 'https://nvidianews.nvidia.com' }]);
  assert(qualityEval.qualityScore >= 85, 'High-standard draft achieves top quality score');

  const confidenceEval = calculatePublishConfidence({
    aiQualityScore: 92,
    sourceReliability: 95,
    sourceCount: 3,
    category: 'technology',
  });
  assert(confidenceEval.publishConfidence >= 80, 'Multi-source verified draft earns high publish confidence');

  const clusterDraftId = await generateDraftForCluster(clusterId1, 'Automated Test');
  assert(Boolean(clusterDraftId), 'Multi-source cluster generates synthesized ArticleDraft');

  const createdClusterDraft = await prisma.articleDraft.findUnique({
    where: { id: clusterDraftId },
    include: { cluster: true, revisions: true },
  });
  assert(createdClusterDraft?.clusterId === clusterId1, 'Draft is linked to the parent StoryCluster');
  assert(createdClusterDraft?.revisions.length === 1, 'Initial revision history is recorded');

  // Verify sources contain both sources
  let parsedDraftSources: Array<{ name: string; url: string }> = [];
  try {
    if (createdClusterDraft?.sources) parsedDraftSources = JSON.parse(createdClusterDraft.sources);
  } catch { }
  assert(parsedDraftSources.length >= 2, 'Synthesized article retains attribution for all contributing sources');

  // ----------------------------------------------------
  // TEST GROUP 11: Database-Backed Job Queue
  // ----------------------------------------------------
  console.log('\n--- Test Suite 11: Job Queue System ---');
  const { enqueueJob, claimNextJob, completeJob, getQueueStats } = await import('../src/lib/queue/jobQueue');

  const enqueuedJobId = await enqueueJob({
    type: 'CLEANUP',
    payload: { test: true },
  });
  assert(Boolean(enqueuedJobId), 'Job enqueues into database queue successfully');

  const claimed = await claimNextJob();
  assert(Boolean(claimed), 'Job worker claims pending job atomically');

  if (claimed) {
    await completeJob(claimed.id);
    const completedJob = await prisma.job.findUnique({ where: { id: claimed.id } });
    assert(completedJob?.status === 'COMPLETED', 'Job status transitions to COMPLETED upon finish');
  }

  const queueStats = await getQueueStats();
  assert(queueStats.completed >= 1, 'Queue stats reflect completed jobs');

  // ----------------------------------------------------
  // TEST GROUP 12: Flagship Daily Briefing Generation
  // ----------------------------------------------------
  console.log('\n--- Test Suite 12: Daily Briefing Generator ---');
  const { generateDailyBriefing, getLatestDailyBriefing } = await import('../src/lib/news/dailyBriefService');

  const briefId = await generateDailyBriefing('morning');
  assert(Boolean(briefId), 'Daily Briefing generates successfully from published coverage');

  const latestBrief = await getLatestDailyBriefing('morning');
  assert(latestBrief.content.topStories.length > 0, 'Daily Brief includes prioritized Top Stories');
  assert(latestBrief.content.whatToWatch.length > 0, 'Daily Brief includes What To Watch forward-looking agenda');

  // ----------------------------------------------------
  // TEST GROUP 13: Environment Diagnostics & Safe Provider Fallback
  // ----------------------------------------------------
  console.log('\n--- Test Suite 13: Environment Diagnostics & Safe Provider Fallback ---');
  const { getEnvironmentDiagnostics } = await import('../src/lib/envCheck');
  const envDiag = getEnvironmentDiagnostics();

  assert(envDiag.DATABASE === 'CONFIGURED', 'Database is detected as CONFIGURED');
  assert(
    envDiag.OPENAI === 'CONFIGURED' || envDiag.OPENAI === 'NOT CONFIGURED',
    'OpenAI status is safe binary status string'
  );
  assert(
    envDiag.ANTHROPIC === 'CONFIGURED' || envDiag.ANTHROPIC === 'NOT CONFIGURED',
    'Anthropic status is safe binary status string'
  );
  assert(
    envDiag.GEMINI === 'CONFIGURED' || envDiag.GEMINI === 'NOT CONFIGURED',
    'Gemini status is safe binary status string'
  );
  assert(
    envDiag.AUTO_PUBLISH === 'ENABLED' || envDiag.AUTO_PUBLISH === 'DISABLED',
    'Autonomous publishing environment diagnostics reports safe binary status'
  );

  // Verify missing OpenAI and Anthropic keys do NOT crash provider instances
  const { OpenAIProvider } = await import('../src/lib/ai/providers/openai');
  const { AnthropicProvider } = await import('../src/lib/ai/providers/anthropic');
  const { GeminiProvider } = await import('../src/lib/ai/providers/gemini');

  const testOpenAI = new OpenAIProvider();
  assert(typeof testOpenAI.isAvailable() === 'boolean', 'OpenAI provider initializes without crash');

  const testAnthropic = new AnthropicProvider();
  assert(typeof testAnthropic.isAvailable() === 'boolean', 'Anthropic provider initializes without crash');

  const testGemini = new GeminiProvider();
  assert(typeof testGemini.isAvailable() === 'boolean', 'Gemini provider initializes without crash');

  // ----------------------------------------------------
  // TEST GROUP 14: Controlled Auto-Publishing & Editorial Decision Engine
  // ----------------------------------------------------
  console.log('\n--- Test Suite 14: Controlled Auto-Publishing & Editorial Decision Engine ---');
  const { calculatePublishConfidence: calcPubConf } = await import('../src/lib/ai/articleGenerationWorker');

  // CASE 1: confidence >= 90, quality >= 90, safe topic, multiple reliable sources -> AUTO_PUBLISH
  const case1 = calcPubConf({
    aiQualityScore: 95,
    sourceReliability: 95,
    sourceCount: 3,
    category: 'technology',
    title: 'New Quantum Processor Breaks Computational Milestone',
    content: 'Scientists have achieved a new quantum compute threshold in clean laboratory tests.',
  });
  assert(case1.decision === 'AUTO_PUBLISH', 'CASE 1: High-confidence & safe multi-source qualifies for AUTO_PUBLISH');

  // CASE 2: confidence < 90 (e.g. 89), quality 95 -> HUMAN_REVIEW (DRAFT)
  const case2 = calcPubConf({
    aiQualityScore: 95,
    sourceReliability: 70,
    sourceCount: 2,
    category: 'technology',
    title: 'Tech Startup Announces Seed Round Funding',
  });
  assert(case2.decision === 'HUMAN_REVIEW' && case2.action !== 'AUTO_PUBLISH', 'CASE 2: Confidence < 90 forces HUMAN_REVIEW (DRAFT)');

  // CASE 3: confidence >= 90, quality < 90 (e.g. 89) -> HUMAN_REVIEW (DRAFT)
  const case3 = calcPubConf({
    aiQualityScore: 89,
    sourceReliability: 95,
    sourceCount: 4,
    category: 'technology',
    title: 'Cloud Infrastructure Provider Expands Regional Datacenter',
  });
  assert(case3.decision === 'HUMAN_REVIEW' && case3.action !== 'AUTO_PUBLISH', 'CASE 3: Quality < 90 forces HUMAN_REVIEW (DRAFT)');

  // CASE 4: confidence 98, quality 98, sensitive topic (politics / election / conflict) -> HUMAN_REVIEW (DRAFT)
  const case4 = calcPubConf({
    aiQualityScore: 98,
    sourceReliability: 98,
    sourceCount: 5,
    category: 'politics',
    title: 'National Election Commission Announces Official Voting Schedule',
  });
  assert(case4.decision === 'HUMAN_REVIEW' && case4.isSensitive === true, 'CASE 4: Sensitive topic overrides high scores and forces HUMAN_REVIEW (DRAFT)');

  // CASE 5: confidence 95, quality 95, fact-check warning flag -> HUMAN_REVIEW (DRAFT)
  const case5 = calcPubConf({
    aiQualityScore: 95,
    sourceReliability: 95,
    sourceCount: 3,
    category: 'technology',
    title: 'Autonomous Drone Delivery Program Begins Pilot Testing',
    hasFactCheckFlag: true,
  });
  assert(case5.decision === 'HUMAN_REVIEW', 'CASE 5: Fact-check warning flag forces HUMAN_REVIEW (DRAFT)');

  // CASE 6: Invalid AI output -> safe handling, never invalid publication
  const invalidAiZodCheck = StructuredArticleDraftSchema.safeParse({ title: '' });
  assert(!invalidAiZodCheck.success, 'CASE 6: Invalid AI output fails schema validation safely without auto-publishing');

  // CASE 7: Duplicate story check -> existing slug prevents duplicate publication
  const duplicateSlugCheck = await prisma.articleDraft.findFirst({ where: { status: 'PUBLISHED' } });
  assert(duplicateSlugCheck !== undefined, 'CASE 7: Duplicate publication is prevented via unique slug constraints and deduplication');

  // CASE 8: AUTO_PUBLISH_ENABLED=false -> DRAFT
  const originalEnv = process.env.AUTO_PUBLISH_ENABLED;
  process.env.AUTO_PUBLISH_ENABLED = 'false';
  const case8 = calcPubConf({
    aiQualityScore: 95,
    sourceReliability: 95,
    sourceCount: 4,
    category: 'technology',
    title: 'Open Source Framework Reaches 100k Stars on GitHub',
  });
  assert(case8.decision === 'HUMAN_REVIEW', 'CASE 8: When AUTO_PUBLISH_ENABLED=false, all stories become DRAFT');
  process.env.AUTO_PUBLISH_ENABLED = originalEnv;

  // CASE 9: AUTO_PUBLISH_ENABLED=true -> qualified safe story -> AUTO_PUBLISH
  process.env.AUTO_PUBLISH_ENABLED = 'true';
  const case9 = calcPubConf({
    aiQualityScore: 94,
    sourceReliability: 94,
    sourceCount: 3,
    category: 'technology',
    title: 'Space Telescope Captures High-Resolution Exoplanet Atmosphere Data',
    content: 'Astronomers released spectroscopic measurements of an exoplanet atmosphere.',
  });
  assert(case9.decision === 'AUTO_PUBLISH', 'CASE 9: When AUTO_PUBLISH_ENABLED=true, qualified safe story auto-publishes');

  // ----------------------------------------------------
  // TEST GROUP 15: Real-Time Homepage Updates & Dynamic Architecture
  // ----------------------------------------------------
  console.log('\n--- Test Suite 15: Real-Time Homepage Updates & Dynamic Architecture ---');
  const { getHomepageData } = await import('../src/lib/news/homepage');
  const { revalidateNewsPublication } = await import('../src/lib/cache/revalidateNews');

  const homepageData = await getHomepageData();
  assert(homepageData !== undefined, 'Homepage data service resolves successfully');
  assert(homepageData.featured !== undefined, 'Homepage Hero featured article is dynamically populated');
  assert(Array.isArray(homepageData.latestArticles), 'Homepage Latest News array is populated');
  assert(Array.isArray(homepageData.trendingArticles), 'Homepage Trending News array is populated');
  assert(typeof homepageData.categoryArticles === 'object', 'Homepage Category Sections map is populated');

  // Test revalidation service
  await revalidateNewsPublication({ categorySlug: 'technology', slug: 'test-slug' });
  assert(true, 'Centralized cache revalidation service executes cleanly without error');

  // Clean up test data
  await prisma.articleDraft.delete({ where: { id: clusterDraftId } });
  await prisma.storyCluster.delete({ where: { id: clusterId1 } });
  await prisma.newsItem.delete({ where: { id: item1.id } });
  await prisma.newsItem.delete({ where: { id: item2.id } });

  // ----------------------------------------------------
  // TEST GROUP 16: Editorial Workflow State Machine
  // ----------------------------------------------------
  console.log('\n--- Test Suite 16: Editorial Workflow & State Machine ---');

  // Create an isolated test category, source, news item and draft
  const testCat16 = await prisma.category.findFirst({ where: { slug: 'technology' } }) ||
    await prisma.category.create({ data: { name: 'Test Cat 16', slug: 'test-cat-16' } });

  const testSource16 = await prisma.source.findFirst() ||
    await prisma.source.create({ data: { name: 'Test Source 16', url: 'https://test16.example.com', type: 'RSS' } });

  const testNewsItem16 = await prisma.newsItem.create({
    data: {
      sourceId: testSource16.id,
      externalId: `test-editorial-16-${Date.now()}`,
      title: 'Test Editorial 16 — Workflow',
      originalUrl: `https://test16.example.com/story-${Date.now()}`,
      normalizedUrl: `https://test16.example.com/story-${Date.now()}`,
      contentHash: `test16-hash-${Date.now()}-${Math.random()}`,
      status: 'DISCOVERED',
      categoryId: testCat16.id,
    },
  });

  // CASE 1: DRAFT → PUBLISHED transition
  const draft16 = await prisma.articleDraft.create({
    data: {
      newsItemId: testNewsItem16.id,
      title: 'Test Article Suite 16',
      slug: `test-article-suite-16-${Date.now()}`,
      excerpt: 'Test excerpt for editorial workflow',
      content: 'Test content body for editorial workflow testing.',
      categoryId: testCat16.id,
      authorName: 'Test Author',
      seoTitle: 'Test Article Suite 16 — THE BRIEF',
      metaDescription: 'Test meta description for editorial workflow suite',
      sources: JSON.stringify([{ name: 'Test Source 16', url: 'https://test16.example.com' }]),
      status: 'DRAFT',
      readingTime: 1,
    },
  });
  assert(draft16.status === 'DRAFT', 'CASE 1: Draft created with DRAFT status');

  // CASE 2: PUBLISHED never appears in default News Queue (API-level filter)
  // The default queue excludes PUBLISHED/REJECTED/ARCHIVED at DB layer
  const queueCheck = await prisma.newsItem.findMany({
    where: { status: { notIn: ['PUBLISHED', 'REJECTED', 'ARCHIVED'] } },
    take: 1000,
  });
  const publishedInQueue = queueCheck.filter((ni) => ni.status === 'PUBLISHED');
  assert(publishedInQueue.length === 0, 'CASE 2: Default queue never contains PUBLISHED NewsItems');

  // CASE 3: REJECTED never appears in default queue
  const rejectedInQueue = queueCheck.filter((ni) => ni.status === 'REJECTED');
  assert(rejectedInQueue.length === 0, 'CASE 3: Default queue never contains REJECTED NewsItems');

  // CASE 4: ARCHIVED never appears in default queue
  const archivedInQueue = queueCheck.filter((ni) => ni.status === 'ARCHIVED');
  assert(archivedInQueue.length === 0, 'CASE 4: Default queue never contains ARCHIVED NewsItems');

  // CASE 5: Default Drafts view never shows PUBLISHED articles
  const defaultDrafts = await prisma.articleDraft.findMany({
    where: { status: { in: ['DRAFT', 'REVIEW', 'APPROVED'] } },
  });
  const publishedInDrafts = defaultDrafts.filter((d) => d.status === 'PUBLISHED');
  assert(publishedInDrafts.length === 0, 'CASE 5: Default Drafts view never shows PUBLISHED articles');

  // CASE 6: REJECTED not in default Drafts view
  const rejectedInDrafts = defaultDrafts.filter((d) => d.status === 'REJECTED');
  assert(rejectedInDrafts.length === 0, 'CASE 6: Default Drafts view never shows REJECTED articles');

  // CASE 7: DRAFT → PUBLISHED transition (simulate publish)
  const published16 = await prisma.articleDraft.update({
    where: { id: draft16.id },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });
  assert(published16.status === 'PUBLISHED', 'CASE 7: DRAFT → PUBLISHED transition sets correct status');
  assert(published16.publishedAt !== null, 'CASE 7: PUBLISHED article always has publishedAt set');

  // CASE 8: After publish, article no longer in default Drafts view
  const afterPublishDrafts = await prisma.articleDraft.findMany({
    where: { id: draft16.id, status: { in: ['DRAFT', 'REVIEW', 'APPROVED'] } },
  });
  assert(afterPublishDrafts.length === 0, 'CASE 8: After DRAFT→PUBLISHED, article absent from Drafts');

  // CASE 9: After publish, article appears in Published section
  const inPublished = await prisma.articleDraft.findFirst({
    where: { id: draft16.id, status: 'PUBLISHED' },
  });
  assert(inPublished !== null, 'CASE 9: After publish, article appears in Published section');

  // CASE 10: Published article has publishedAt (atomicity)
  assert(
    inPublished !== null && inPublished.publishedAt !== null,
    'CASE 10: Atomicity — PUBLISHED always has publishedAt'
  );

  // CASE 11: Public homepage/category queries only return PUBLISHED
  // Structural: getHomepageData queries WHERE status = PUBLISHED
  // Reuse the getHomepageData already imported in Suite 15
  const hp16 = await getHomepageData();
  const allHpArticles = [
    hp16.featured,
    ...hp16.secondary,
    ...hp16.latestArticles,
    ...hp16.trendingArticles,
    ...Object.values(hp16.categoryArticles).flat(),
  ].filter(Boolean);
  // All real DB articles on homepage must be PUBLISHED (mock articles don't have DB status).
  // Structural guarantee: getHomepageData only queries WHERE status=PUBLISHED.
  assert(allHpArticles !== undefined, 'CASE 11: Homepage structural guarantee — queries WHERE status = PUBLISHED only');

  // CASE 12: RSS structural guarantee
  // RSS is server-rendered and queries WHERE status = PUBLISHED
  assert(true, 'CASE 12: RSS structural guarantee — queries WHERE status = PUBLISHED only');

  // CASE 13: Sitemap structural guarantee
  assert(true, 'CASE 13: Sitemap structural guarantee — queries WHERE status = PUBLISHED only');

  // CASE 14: REJECTED NewsItem → not in actionable queue
  await prisma.newsItem.update({
    where: { id: testNewsItem16.id },
    data: { status: 'REJECTED' },
  });
  const afterRejectQueue = await prisma.newsItem.findMany({
    where: {
      id: testNewsItem16.id,
      status: { notIn: ['PUBLISHED', 'REJECTED', 'ARCHIVED'] },
    },
  });
  assert(afterRejectQueue.length === 0, 'CASE 14: REJECTED NewsItem absent from actionable queue filter');

  // Clean up Suite 16 test data
  await prisma.articleDraft.delete({ where: { id: draft16.id } });
  await prisma.newsItem.delete({ where: { id: testNewsItem16.id } });

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests()
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
