import { prisma } from '../db';
import { getEnabledSources } from './sourceRegistry';
import { fetchRssFeed } from './rssFetcher';
import { normalizeUrl, generateContentHash } from './normalization';
import { classifyCategory } from './classifier';

export interface CollectionSummary {
  sourcesProcessed: number;
  successfulSources: number;
  failedSources: number;
  itemsFound: number;
  newItems: number;
  duplicates: number;
}

export async function collectAllNews(): Promise<CollectionSummary> {
  const sources = getEnabledSources();
  
  const summary: CollectionSummary = {
    sourcesProcessed: sources.length,
    successfulSources: 0,
    failedSources: 0,
    itemsFound: 0,
    newItems: 0,
    duplicates: 0,
  };

  for (const sourceConfig of sources) {
    console.log(`[NEWS] Fetching source: ${sourceConfig.name}`);
    const startedAt = new Date();
    
    // Ensure source exists in DB
    let dbSource = await prisma.source.findUnique({ where: { id: sourceConfig.id } });
    if (!dbSource) {
      dbSource = await prisma.source.create({
        data: {
          id: sourceConfig.id,
          name: sourceConfig.name,
          type: sourceConfig.type,
          url: sourceConfig.url,
          country: sourceConfig.country,
          language: sourceConfig.language,
          priority: sourceConfig.priority,
        }
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
        const normUrl = normalizeUrl(item.originalUrl);
        const contentHash = generateContentHash(item.title, sourceConfig.id);
        const categoryName = classifyCategory(item.title, sourceConfig.defaultCategory);
        
        // Find or create category
        let dbCategory = await prisma.category.findUnique({ where: { slug: categoryName } });
        if (!dbCategory) {
          dbCategory = await prisma.category.create({
            data: {
              name: categoryName.charAt(0).toUpperCase() + categoryName.slice(1),
              slug: categoryName
            }
          });
        }

        // Check for duplicates
        const existingItem = await prisma.newsItem.findFirst({
          where: {
            OR: [
              { normalizedUrl: normUrl },
              { contentHash: contentHash }
            ]
          }
        });

        if (existingItem) {
          duplicates++;
          summary.duplicates++;
          continue;
        }

        // Insert new item
        await prisma.newsItem.create({
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
            contentHash: contentHash,
            status: 'DISCOVERED'
          }
        });
        
        newItems++;
        summary.newItems++;
      }

      // Update source health on success
      await prisma.source.update({
        where: { id: sourceConfig.id },
        data: {
          lastFetch: new Date(),
          lastError: null
        }
      });
      
      summary.successfulSources++;
      console.log(`[NEWS] Source ${sourceConfig.name} success: ${newItems} new, ${duplicates} duplicates.`);
      
    } catch (error: any) {
      summary.failedSources++;
      errorMessage = error.message || 'Unknown error';
      console.error(`[NEWS] Source ${sourceConfig.name} failed: ${errorMessage}`);
      
      // Update source health on error
      await prisma.source.update({
        where: { id: sourceConfig.id },
        data: {
          lastError: errorMessage
        }
      });
    }

    // Save fetch log
    await prisma.fetchLog.create({
      data: {
        sourceId: sourceConfig.id,
        startedAt,
        completedAt: new Date(),
        status: errorMessage ? 'ERROR' : 'SUCCESS',
        itemsFound,
        newItems,
        duplicates,
        errorMessage
      }
    });
  }

  return summary;
}
