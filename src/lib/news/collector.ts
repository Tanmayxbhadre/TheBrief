import { prisma } from '../db';
import { getEnabledSources } from './sourceRegistry';
import { fetchRssFeed } from './rssFetcher';
import { normalizeUrl, generateContentHash } from './normalization';
import { classifyCategory } from './classifier';
import { analyzeNewsItem } from './newsIntelligenceService';
import { assignItemToCluster } from './clustering';

export interface SourceFailureRecord {
  sourceId: string;
  sourceName: string;
  error: string;
}

export interface CollectionSummary {
  sourcesProcessed: number;
  successfulSources: number;
  failedSources: number;
  itemsFound: number;
  newItems: number;
  duplicates: number;
  staleFiltered: number;
  sourceErrors?: SourceFailureRecord[];
}

// How far back (in hours) a freshly-fetched article is allowed to be published
// and still be considered "new" for ingestion. Configurable via NEWS_LOOKBACK_HOURS.
// Items without a parseable publish date are always kept (better to review than to miss).
function getLookbackHours(): number {
  const parsed = parseFloat(process.env.NEWS_LOOKBACK_HOURS || '2');
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

export async function collectAllNews(): Promise<CollectionSummary> {
  const sources = getEnabledSources();
  const sourceErrors: SourceFailureRecord[] = [];
  const lookbackHours = getLookbackHours();

  const summary: CollectionSummary = {
    sourcesProcessed: sources.length,
    successfulSources: 0,
    failedSources: 0,
    itemsFound: 0,
    newItems: 0,
    duplicates: 0,
    staleFiltered: 0,
    sourceErrors,
  };

  for (const sourceConfig of sources) {
    console.log(`[NEWS] Fetching source: ${sourceConfig.name}`);
    const startedAt = new Date();

    // Ensure source exists in DB
    const dbSource = await prisma.source.findUnique({ where: { id: sourceConfig.id } });
    if (!dbSource) {
      await prisma.source.create({
        data: {
          id: sourceConfig.id,
          name: sourceConfig.name,
          type: sourceConfig.type,
          url: sourceConfig.url,
          country: sourceConfig.country,
          language: sourceConfig.language,
          priority: sourceConfig.priority,
          enabled: sourceConfig.enabled,
        },
      });
    }

    let itemsFound = 0;
    let newItems = 0;
    let duplicates = 0;
    let errorMessage: string | undefined;

    try {
      if (sourceConfig.type !== 'rss') {
        throw new Error('Only RSS type is supported in this phase');
      }

      const parsedItems = await fetchRssFeed(sourceConfig);
      itemsFound = parsedItems.length;
      summary.itemsFound += itemsFound;

      for (const item of parsedItems) {
        // Freshness filter: skip articles published outside the configured lookback
        // window so we don't keep re-evaluating the same old backlog every run.
        if (item.publishedAt) {
          const ageHours = (Date.now() - item.publishedAt.getTime()) / (1000 * 60 * 60);
          if (ageHours > lookbackHours) {
            summary.staleFiltered++;
            continue;
          }
        }

        const normUrl = normalizeUrl(item.originalUrl);
        const contentHash = generateContentHash(item.title, sourceConfig.id);
        const categoryName = classifyCategory(item.title, sourceConfig.defaultCategory);

        // Find or create category
        let dbCategory = await prisma.category.findUnique({ where: { slug: categoryName } });
        if (!dbCategory) {
          dbCategory = await prisma.category.create({
            data: {
              name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
              slug: categoryName,
            },
          });
        }

        // Check for duplicates
        const existingItem = await prisma.newsItem.findFirst({
          where: {
            OR: [{ normalizedUrl: normUrl }, { contentHash: contentHash }],
          },
        });

        if (existingItem) {
          duplicates++;
          summary.duplicates++;
          continue;
        }

        // Compute news intelligence metrics
        const intelligence = await analyzeNewsItem({
          title: item.title,
          description: item.description,
          sourceId: sourceConfig.id,
          publishedAt: item.publishedAt,
          defaultCategory: categoryName,
        });

        // Insert new item safely with intelligence
        try {
          const created = await prisma.newsItem.create({
            data: {
              sourceId: sourceConfig.id,
              externalId: item.externalId,
              title: item.title,
              description: item.description,
              originalUrl: item.originalUrl,
              normalizedUrl: normUrl,
              author: item.author,
              publishedAt: item.publishedAt,
              imageUrl: item.imageUrl,
              categoryId: dbCategory.id,
              subcategory: intelligence.subcategory,
              importanceScore: intelligence.importanceScore,
              importanceReason: intelligence.importanceReason,
              breakingScore: intelligence.breakingScore,
              isBreaking: intelligence.isBreaking,
              trendingScore: intelligence.trendingScore,
              entities: JSON.stringify(intelligence.entities),
              editorialRecommendation: intelligence.editorialRecommendation,
              confidenceScore: intelligence.confidenceScore,
              intelligenceProcessed: true,
              contentHash: contentHash,
              status: 'DISCOVERED',
            },
          });

          // Assign to cluster
          try {
            await assignItemToCluster(created.id);
          } catch (clusterErr) {
            console.warn('[NEWS] Failed to cluster item:', clusterErr);
          }

          newItems++;
          summary.newItems++;
        } catch {
          // If race condition on unique constraint occurs, treat as duplicate
          duplicates++;
          summary.duplicates++;
        }
      }

      // Update source health on success
      await prisma.source.update({
        where: { id: sourceConfig.id },
        data: {
          lastFetch: new Date(),
          lastSuccessfulFetch: new Date(),
          lastError: null,
          consecutiveFailures: 0,
        },
      });

      summary.successfulSources++;
      console.log(`[NEWS] Source ${sourceConfig.name} success: ${newItems} new, ${duplicates} duplicates.`);
    } catch (error: unknown) {
      summary.failedSources++;
      errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[NEWS] Source ${sourceConfig.name} failed: ${errorMessage}`);

      sourceErrors.push({
        sourceId: sourceConfig.id,
        sourceName: sourceConfig.name,
        error: errorMessage,
      });

      // Update source health on error
      await prisma.source.update({
        where: { id: sourceConfig.id },
        data: {
          lastFetch: new Date(),
          lastError: errorMessage,
          consecutiveFailures: {
            increment: 1,
          },
        },
      });
    }

    // Save fetch log
    try {
      await prisma.fetchLog.create({
        data: {
          sourceId: sourceConfig.id,
          startedAt,
          completedAt: new Date(),
          status: errorMessage ? 'ERROR' : 'SUCCESS',
          itemsFound,
          newItems,
          duplicates,
          errorMessage,
        },
      });
    } catch (logErr) {
      console.error('[NEWS] Failed to write FetchLog:', logErr);
    }
  }

  return summary;
}
