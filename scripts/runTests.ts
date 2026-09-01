import {
  StructuredArticleDraftSchema,
  HeadlineImprovementSchema,
  SummaryImprovementSchema,
  SeoImprovementSchema,
  TagsImprovementSchema,
  RewriteImprovementSchema,
  FactCheckImprovementSchema,
} from '../src/lib/ai/schemas';
import { aiService } from '../src/lib/ai/service';
import { sanitizeAiText, sanitizeStructuredAiOutput } from '../src/lib/ai/sanitize';
import { aiRateLimiter } from '../src/lib/ai/rateLimit';

let passed = 0;
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
  console.log('THEBRIEF PHASE 5 — COMPREHENSIVE TEST SUITE');
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
  // Summary
  // ----------------------------------------------------
  console.log('\n==================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
