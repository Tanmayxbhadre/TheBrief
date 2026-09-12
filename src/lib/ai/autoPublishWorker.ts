import { prisma } from '../db';
import { isSensitiveContent } from './articleGenerationWorker';
import { revalidateNewsPublication } from '../cache/revalidateNews';
import { optimizeArticleSeo } from '../seo/optimizer';

export interface AutoPublishResult {
  swept: number;
  published: number;
  skipped: number;
  errors: Array<{ id: string; title: string; reason: string }>;
}

/**
 * Scans APPROVED drafts and auto-publishes those that meet quality/confidence
 * thresholds and are not flagged as sensitive content.
 *
 * Runs as step 6 of the hourly news cron AND as a dedicated /api/cron/publish
 * endpoint 30 minutes after the main cron, catching any drafts promoted since.
 */
export async function runAutoPublishWorker(limit = 20): Promise<AutoPublishResult> {
  const autoPublishEnabled = process.env.AUTO_PUBLISH_ENABLED === 'true';

  if (!autoPublishEnabled) {
    console.log('[AUTO-PUBLISH] Disabled via AUTO_PUBLISH_ENABLED env var.');
    return { swept: 0, published: 0, skipped: 0, errors: [] };
  }

  const minConfidence = parseInt(process.env.AUTO_PUBLISH_MIN_CONFIDENCE || '70', 10);
  const minQuality = parseInt(process.env.AUTO_PUBLISH_MIN_QUALITY || '65', 10);

  const candidates = await prisma.articleDraft.findMany({
    where: {
      status: 'APPROVED',
      publishConfidence: { gte: minConfidence },
      aiQualityScore: { gte: minQuality },
    },
    include: { category: true },
    orderBy: { publishConfidence: 'desc' },
    take: limit,
  });

  const result: AutoPublishResult = {
    swept: candidates.length,
    published: 0,
    skipped: 0,
    errors: [],
  };

  if (candidates.length === 0) {
    console.log('[AUTO-PUBLISH] No APPROVED drafts meet the auto-publish thresholds.');
    return result;
  }

  console.log(`[AUTO-PUBLISH] ${candidates.length} candidates found. Processing...`);

  const now = new Date();

  for (const draft of candidates) {
    try {
      const combinedText = `${draft.title} ${draft.excerpt ?? ''} ${draft.content ?? ''}`;
      const categorySlug = draft.category?.slug ?? '';

      if (isSensitiveContent(combinedText, categorySlug)) {
        console.log(`[AUTO-PUBLISH] Skipped "${draft.title}" — sensitive content.`);
        result.skipped++;
        continue;
      }

      // Optimize SEO attributes before publishing
      const optimizedSeo = optimizeArticleSeo({
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        seoTitle: draft.seoTitle,
        metaDescription: draft.metaDescription,
        categorySlug,
        authorName: draft.authorName,
        featuredImage: draft.featuredImage,
        imageAlt: draft.imageAlt,
        sources: draft.sources,
        quickSummary: draft.quickSummary,
        whatYouNeedToKnow: draft.whatYouNeedToKnow,
        tags: draft.tags,
      });

      await prisma.articleDraft.update({
        where: { id: draft.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: now,
          autoPublished: true,
          seoTitle: optimizedSeo.seoTitle,
          metaDescription: optimizedSeo.metaDescription,
          canonicalUrl: optimizedSeo.canonicalUrl,
          imageAlt: optimizedSeo.imageAlt,
          tags: JSON.stringify(optimizedSeo.tags),
        },
      });

      if (draft.newsItemId) {
        await prisma.newsItem.update({
          where: { id: draft.newsItemId },
          data: { status: 'PUBLISHED' },
        });
      }

      await prisma.activityLog.create({
        data: {
          user: 'Autonomous AI Newsroom',
          action: 'article_auto_published',
          target: draft.title,
          details: `Auto-published APPROVED draft. Quality: ${draft.aiQualityScore ?? '?'}%, Confidence: ${draft.publishConfidence ?? '?'}%.`,
        },
      });

      await revalidateNewsPublication({
        categorySlug: draft.category?.slug,
        slug: draft.slug,
      });

      result.published++;
      console.log(`[AUTO-PUBLISH] Published: "${draft.title}" (${draft.slug})`);
    } catch (err: unknown) {
      const reason = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[AUTO-PUBLISH] Failed draft ${draft.id}:`, reason);
      result.errors.push({ id: draft.id, title: draft.title, reason });
    }
  }

  console.log(
    `[AUTO-PUBLISH] Done. Published: ${result.published}, Skipped: ${result.skipped}, Errors: ${result.errors.length}`
  );

  return result;
}
