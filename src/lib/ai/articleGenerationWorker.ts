import { prisma } from '../db';
import { aiService } from './service';
import { GenerateDraftRequest, StructuredArticleDraft } from './types';
import { SOURCES } from '../news/sourceRegistry';
import { revalidateNewsPublication } from '../cache/revalidateNews';

export interface QualityEvaluationResult {
  qualityScore: number;
  publishConfidence: number;
  action: 'AUTO_PUBLISH' | 'ADMIN_QUICK_REVIEW' | 'FULL_EDITORIAL_REVIEW' | 'HOLD';
  decision: 'AUTO_PUBLISH' | 'HUMAN_REVIEW';
  decisionReason: string;
  notes: string[];
  isSensitive: boolean;
}

export const SENSITIVE_CATEGORIES = new Set([
  'politics',
  'legal',
  'crime',
  'emergency',
  'defense',
  'military',
  'elections',
  'war',
  'disasters',
  'national-security',
]);

export const SENSITIVE_KEYWORD_PATTERNS = [
  /\b(election|elections|ballot|voting|poll|politician|parliament|congress|minister|president|prime minister)\b/i,
  /\b(war|warfare|missile|airstrike|bombing|invasion|troops|military strike|ceasefire)\b/i,
  /\b(terror|terrorist|terrorism|hostage|hijack|extremist)\b/i,
  /\b(killed|dead|deaths|fatality|casualties|suicide|murder|homicide|mass shooting|assassination|slain)\b/i,
  /\b(arrest|arrested|indictment|indicted|charged with|allegation|lawsuit|prosecutor|convicted|guilty of)\b/i,
  /\b(health emergency|outbreak|epidemic|pandemic|contagion|virus outbreak)\b/i,
  /\b(financial crisis|bank run|bankruptcy|debt default|market collapse|fraud scheme)\b/i,
];

export function isSensitiveContent(text: string, category: string): boolean {
  if (SENSITIVE_CATEGORIES.has(category.toLowerCase())) {
    return true;
  }
  return SENSITIVE_KEYWORD_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Evaluates the quality of a generated structured article draft (0–100)
 */
export function calculateAiQualityScore(
  draft: StructuredArticleDraft,
  inputSources: Array<{ name: string; url: string }> = []
): { qualityScore: number; notes: string[] } {
  let score = 0;
  const notes: string[] = [];

  // 1. Title & Excerpt quality
  if (draft.title && draft.title.length >= 15 && draft.title.length <= 120) {
    score += 15;
  } else {
    notes.push('Headline length outside optimal range');
  }

  if (draft.excerpt && draft.excerpt.length >= 50 && draft.excerpt.length <= 250) {
    score += 15;
  } else {
    notes.push('Excerpt length outside optimal range');
  }

  // 2. Structured journalistic modules
  if (draft.quickSummary && draft.quickSummary.length >= 2) {
    score += 15;
  } else {
    notes.push('Quick summary has fewer than 2 points');
  }

  if (
    draft.whatYouNeedToKnow &&
    draft.whatYouNeedToKnow.whatHappened &&
    draft.whatYouNeedToKnow.whyItMatters
  ) {
    score += 20;
  } else {
    notes.push('Incomplete "What You Need To Know" breakdown');
  }

  // 3. Content body depth
  if (draft.content && draft.content.length >= 300) {
    score += 15;
  } else {
    notes.push('Article body content is too brief');
  }

  // 4. Source preservation & attribution
  if (draft.sources && draft.sources.length > 0) {
    score += 10;
    if (inputSources.length > 0) {
      const retainedCount = inputSources.filter((is) =>
        draft.sources.some((ds) => ds.name.toLowerCase() === is.name.toLowerCase())
      ).length;
      if (retainedCount === inputSources.length) {
        score += 10;
      }
    }
  } else {
    notes.push('Missing source attributions');
  }

  // 5. Penalties for placeholders or hallucinations
  const combined = `${draft.title} ${draft.excerpt} ${draft.content}`.toLowerCase();
  if (
    combined.includes('lorem ipsum') ||
    combined.includes('insert quote') ||
    combined.includes('todo') ||
    combined.includes('[source name]')
  ) {
    score -= 40;
    notes.push('Flagged for placeholder or template artifacts');
  }

  if (draft.reviewFlags?.needsVerification) {
    score -= 10;
    notes.push('AI flagged claims needing human verification');
  }

  const qualityScore = Math.min(100, Math.max(0, score));
  return { qualityScore, notes };
}

/**
 * Calculates publish confidence (0–100) and determines editorial action
 */
export function calculatePublishConfidence(options: {
  aiQualityScore: number;
  sourceReliability: number;
  sourceCount: number;
  category: string;
  title?: string;
  content?: string;
  hasFactCheckFlag?: boolean;
  isBreaking?: boolean;
}): QualityEvaluationResult {
  const {
    aiQualityScore,
    sourceReliability,
    sourceCount,
    category,
    title = '',
    content = '',
    hasFactCheckFlag = false,
    isBreaking = false,
  } = options;
  const notes: string[] = [];

  // Weighted confidence calculation:
  // - Source reliability: 35%
  // - Multi-source agreement / breadth: 25%
  // - AI Quality: 30%
  // - Freshness / verification: 10%
  let multiSourceBonus = 10;
  if (sourceCount >= 5) multiSourceBonus = 25;
  else if (sourceCount >= 3) multiSourceBonus = 20;
  else if (sourceCount >= 2) multiSourceBonus = 15;

  const rawConfidence =
    sourceReliability * 0.35 +
    multiSourceBonus +
    aiQualityScore * 0.30 +
    (isBreaking ? 5 : 10);

  const publishConfidence = Math.min(100, Math.max(0, Math.round(rawConfidence)));

  // Safety & Threshold rules
  const combinedText = `${title} ${content}`;
  const isSensitive = isSensitiveContent(combinedText, category);
  const autoPublishEnabled = process.env.AUTO_PUBLISH_ENABLED === 'true';
  const minConfidence = parseInt(process.env.AUTO_PUBLISH_MIN_CONFIDENCE || '90', 10);
  const minQuality = parseInt(process.env.AUTO_PUBLISH_MIN_QUALITY || '90', 10);

  // Compile detailed failure reasons
  const failureReasons: string[] = [];
  if (!autoPublishEnabled) {
    failureReasons.push('Auto-publishing is disabled in configuration');
  }
  if (isSensitive) {
    failureReasons.push('Sensitive topic requires human review');
  }
  if (hasFactCheckFlag) {
    failureReasons.push('Fact-check warning detected');
  }
  if (publishConfidence < minConfidence) {
    failureReasons.push(`Confidence score below auto-publish threshold (${publishConfidence} < ${minConfidence})`);
  }
  if (aiQualityScore < minQuality) {
    failureReasons.push(`Quality score below auto-publish threshold (${aiQualityScore} < ${minQuality})`);
  }
  if (sourceReliability < 88) {
    failureReasons.push(`Source reliability below threshold (${sourceReliability} < 88)`);
  }
  if (sourceCount < 2) {
    failureReasons.push(`Insufficient independent sources (${sourceCount} < 2)`);
  }

  let action: 'AUTO_PUBLISH' | 'ADMIN_QUICK_REVIEW' | 'FULL_EDITORIAL_REVIEW' | 'HOLD';
  let decision: 'AUTO_PUBLISH' | 'HUMAN_REVIEW' = 'HUMAN_REVIEW';
  let decisionReason = '';

  const passesAllChecks =
    autoPublishEnabled &&
    !isSensitive &&
    !hasFactCheckFlag &&
    publishConfidence >= minConfidence &&
    aiQualityScore >= minQuality &&
    sourceReliability >= 88 &&
    sourceCount >= 2;

  if (passesAllChecks) {
    action = 'AUTO_PUBLISH';
    decision = 'AUTO_PUBLISH';
    decisionReason = 'High-confidence multi-source reporting with no critical warnings.';
    notes.push(decisionReason);
  } else {
    decision = 'HUMAN_REVIEW';
    decisionReason = failureReasons[0] || 'Requires editorial verification before publishing.';
    notes.push(...failureReasons);

    if (publishConfidence >= 75) {
      action = 'ADMIN_QUICK_REVIEW';
    } else if (publishConfidence >= 50) {
      action = 'FULL_EDITORIAL_REVIEW';
    } else {
      action = 'HOLD';
    }
  }

  return {
    qualityScore: aiQualityScore,
    publishConfidence,
    action,
    decision,
    decisionReason,
    notes,
    isSensitive,
  };
}

/**
 * Generates an article draft from a StoryCluster (Multi-Source Synthesis)
 */
export async function generateDraftForCluster(
  clusterId: string,
  user = 'Autonomous AI Newsroom'
): Promise<string> {
  const cluster = await prisma.storyCluster.findUnique({
    where: { id: clusterId },
    include: {
      category: true,
      items: {
        include: { source: true },
        orderBy: { publishedAt: 'desc' },
      },
    },
  });

  if (!cluster || cluster.items.length === 0) {
    throw new Error(`Cluster ${clusterId} not found or contains no news items`);
  }

  // Identify primary source (highest reliability/priority) and additional sources
  const sortedItems = [...cluster.items].sort((a, b) => {
    const relA = a.source?.reliabilityScore || 85;
    const relB = b.source?.reliabilityScore || 85;
    return relB - relA;
  });

  const primaryItem = sortedItems[0];
  const otherItems = sortedItems.slice(1);

  const primarySourceConfig = SOURCES.find((s) => s.id === primaryItem.sourceId);
  const primarySourceContext = {
    name: primaryItem.source?.name || primarySourceConfig?.name || 'Wire Agency',
    url: primaryItem.originalUrl,
    description: primaryItem.description || undefined,
    isPrimary: true,
  };

  const additionalSourcesContext = otherItems.map((item) => {
    const srcConfig = SOURCES.find((s) => s.id === item.sourceId);
    return {
      name: item.source?.name || srcConfig?.name || 'News Source',
      url: item.originalUrl,
      description: item.description || undefined,
      isPrimary: false,
    };
  });

  const allSourcesInput = [
    { name: primarySourceContext.name, url: primarySourceContext.url },
    ...additionalSourcesContext.map((s) => ({ name: s.name, url: s.url })),
  ];

  const request: GenerateDraftRequest = {
    clusterId: cluster.id,
    newsItemId: primaryItem.id,
    headline: cluster.canonicalTitle || cluster.title,
    description: cluster.summary || primaryItem.description || undefined,
    primarySource: primarySourceContext,
    additionalSources: additionalSourcesContext,
    categorySlug: cluster.category?.slug || 'technology',
    subcategory: primaryItem.subcategory || undefined,
    mode: cluster.isBreaking ? 'breaking' : 'standard',
  };

  // Run AI generation through AIService (handles multi-provider fallback automatically)
  const aiResponse = await aiService.generateArticleDraft(request, user);
  const draftData = aiResponse.draft;

  // Quality & Confidence Scoring
  const avgReliability = Math.round(
    cluster.items.reduce((acc, i) => acc + (i.source?.reliabilityScore || 85), 0) / cluster.items.length
  );

  const { qualityScore } = calculateAiQualityScore(draftData, allSourcesInput);
  const evaluation = calculatePublishConfidence({
    aiQualityScore: qualityScore,
    sourceReliability: avgReliability,
    sourceCount: cluster.items.length,
    category: cluster.category?.slug || 'technology',
    title: draftData.title,
    content: `${draftData.excerpt || ''} ${draftData.content || ''}`,
    hasFactCheckFlag: !!draftData.reviewFlags?.needsVerification,
    isBreaking: cluster.isBreaking,
  });

  const shouldAutoPublish = evaluation.decision === 'AUTO_PUBLISH';
  const draftStatus = shouldAutoPublish ? 'PUBLISHED' : 'DRAFT';

  // Ensure unique slug
  let uniqueSlug = draftData.suggestedSlug;
  const existingSlug = await prisma.articleDraft.findUnique({ where: { slug: uniqueSlug } });
  if (existingSlug) {
    uniqueSlug = `${uniqueSlug}-${Date.now().toString().slice(-4)}`;
  }

  const editorialMetadata = {
    decision: evaluation.decision,
    decisionReason: evaluation.decisionReason,
    notes: evaluation.notes,
    confidenceScore: evaluation.publishConfidence,
    qualityScore: qualityScore,
    sourceReliability: avgReliability,
    sourceCount: cluster.items.length,
    isSensitive: evaluation.isSensitive,
  };

  // Create ArticleDraft
  const createdDraft = await prisma.articleDraft.create({
    data: {
      newsItemId: primaryItem.id,
      clusterId: cluster.id,
      title: draftData.title,
      slug: uniqueSlug,
      excerpt: draftData.excerpt,
      content: draftData.content,
      categoryId: cluster.categoryId,
      subcategory: draftData.subcategory || primaryItem.subcategory,
      authorName: 'THE BRIEF Editorial Team',
      featuredImage: cluster.leadImageUrl || primaryItem.imageUrl || undefined,
      imageAlt: primaryItem.imageAlt || draftData.title,
      status: draftStatus,
      seoTitle: draftData.seoTitle,
      metaDescription: draftData.metaDescription,
      canonicalUrl: `https://thebrief.in/${cluster.category?.slug || 'news'}/${uniqueSlug}`,
      tags: JSON.stringify(draftData.tags),
      sources: JSON.stringify(draftData.sources),
      quickSummary: JSON.stringify(draftData.quickSummary),
      whatYouNeedToKnow: draftData.whatYouNeedToKnow ? JSON.stringify(draftData.whatYouNeedToKnow) : null,
      timeline: draftData.timeline ? JSON.stringify(draftData.timeline) : null,
      internalNotes: JSON.stringify(editorialMetadata),
      readingTime: draftData.readingTime || 3,
      breaking: cluster.isBreaking,
      aiGenerated: true,
      aiProvider: aiResponse.provider,
      aiModel: aiResponse.model,
      aiQualityScore: qualityScore,
      publishConfidence: evaluation.publishConfidence,
      autoPublished: shouldAutoPublish,
      aiFlags: JSON.stringify(draftData.reviewFlags),
      publishedAt: shouldAutoPublish ? new Date() : null,
    },
  });

  // Create initial revision
  await prisma.articleRevision.create({
    data: {
      draftId: createdDraft.id,
      changedBy: user,
      changeType: shouldAutoPublish ? 'auto_publish' : 'initial_draft',
      title: createdDraft.title,
      excerpt: createdDraft.excerpt,
      content: createdDraft.content,
      sources: createdDraft.sources,
    },
  });

  // Update cluster status
  await prisma.storyCluster.update({
    where: { id: cluster.id },
    data: { status: shouldAutoPublish ? 'PUBLISHED' : 'DRAFTED' },
  });

  // Update cluster items status
  await prisma.newsItem.updateMany({
    where: { clusterId: cluster.id },
    data: { status: shouldAutoPublish ? 'PUBLISHED' : 'APPROVED' },
  });

  // Record activity log
  await prisma.activityLog.create({
    data: {
      user,
      action: shouldAutoPublish ? 'article_published' : 'ai_draft_generated',
      target: createdDraft.title,
      details: `Generated from Cluster #${cluster.id.slice(0, 8)} (${cluster.items.length} sources). Quality: ${qualityScore}%, Confidence: ${evaluation.publishConfidence}%. Action: ${evaluation.action}`,
    },
  });

  // Trigger cache revalidation if auto-published
  if (shouldAutoPublish) {
    await revalidateNewsPublication({
      categorySlug: cluster.category?.slug,
      slug: createdDraft.slug,
    });
  }

  return createdDraft.id;
}

/**
 * Background Article Generation Worker: scans for eligible items & clusters and generates drafts
 */
export async function runArticleGenerationWorker(limit = 3): Promise<{
  processed: number;
  draftsCreated: number;
  errors: Array<{ id: string; error: string }>;
}> {
  const errors: Array<{ id: string; error: string }> = [];
  let draftsCreated = 0;

  // 1. Process multi-source clusters first (higher value)
  const candidateClusters = await prisma.storyCluster.findMany({
    where: {
      status: { in: ['PENDING', 'ACTIVE'] },
      sourceCount: { gte: 2 },
    },
    take: limit,
    orderBy: { importanceScore: 'desc' },
  });

  for (const cluster of candidateClusters) {
    try {
      await generateDraftForCluster(cluster.id);
      draftsCreated++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      errors.push({ id: cluster.id, error: msg });
      console.error(`[AI-WORKER] Failed cluster ${cluster.id}:`, msg);
    }
  }

  return {
    processed: candidateClusters.length,
    draftsCreated,
    errors,
  };
}
