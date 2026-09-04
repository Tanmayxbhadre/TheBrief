import { prisma } from '../db';
import slugify from 'slugify';
import { extractEntities, ExtractedEntities } from './newsIntelligenceService';

// Common English stopwords to ignore in title similarity
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and',
  'any', 'are', 'aren', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'cannot', 'could', 'did',
  'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him',
  'himself', 'his', 'how', 'i', 'if', 'in', 'into', 'is', 'isn', 'it', 'its',
  'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not',
  'now', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours',
  'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some',
  'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'wasn', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours',
  'says', 'said', 'new', 'first', 'report', 'reports', 'amid', 'via',
]);

/**
 * Tokenizes a string into meaningful normalized keywords
 */
export function tokenizeText(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(words);
}

/**
 * Computes Jaccard Similarity coefficient between two token sets
 */
export function computeJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionSize = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionSize++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionSize;
  return unionSize > 0 ? intersectionSize / unionSize : 0;
}

/**
 * Computes overlap score between two sets of extracted entities
 */
export function computeEntityOverlap(entitiesA: ExtractedEntities, entitiesB: ExtractedEntities): number {
  const allA = new Set([
    ...entitiesA.companies,
    ...entitiesA.people,
    ...entitiesA.products,
    ...entitiesA.locations,
    ...entitiesA.technologies,
  ]);

  const allB = new Set([
    ...entitiesB.companies,
    ...entitiesB.people,
    ...entitiesB.products,
    ...entitiesB.locations,
    ...entitiesB.technologies,
  ]);

  if (allA.size === 0 || allB.size === 0) return 0;

  let matches = 0;
  for (const ent of allA) {
    if (allB.has(ent)) {
      matches++;
    }
  }

  return matches / Math.max(1, Math.min(allA.size, allB.size));
}

/**
 * Computes multi-factor composite similarity score (0.0 to 1.0) between two stories
 */
export function computeStorySimilarity(
  storyA: { title: string; description?: string | null; publishedAt?: Date | null; categoryId?: string | null },
  storyB: { title: string; description?: string | null; publishedAt?: Date | null; categoryId?: string | null }
): number {
  // 1. Category check: incompatible categories reduce match confidence
  if (storyA.categoryId && storyB.categoryId && storyA.categoryId !== storyB.categoryId) {
    // If different top-level categories, penalty unless tech/ai
    return 0.1;
  }

  // 2. Time-window check: stories older than 72 hours are unlikely to be same event
  if (storyA.publishedAt && storyB.publishedAt) {
    const timeDiffHours = Math.abs(
      new Date(storyA.publishedAt).getTime() - new Date(storyB.publishedAt).getTime()
    ) / (1000 * 60 * 60);

    if (timeDiffHours > 72) return 0;
  }

  const tokensA = tokenizeText(`${storyA.title} ${storyA.description || ''}`);
  const tokensB = tokenizeText(`${storyB.title} ${storyB.description || ''}`);
  const titleTokensA = tokenizeText(storyA.title);
  const titleTokensB = tokenizeText(storyB.title);

  const titleJaccard = computeJaccardSimilarity(titleTokensA, titleTokensB);
  const contentJaccard = computeJaccardSimilarity(tokensA, tokensB);

  const entitiesA = extractEntities(storyA.title, storyA.description || '');
  const entitiesB = extractEntities(storyB.title, storyB.description || '');
  const entityScore = computeEntityOverlap(entitiesA, entitiesB);

  // Weights:
  // Title similarity: 0.45
  // Entity overlap: 0.35
  // Content Jaccard: 0.20
  let compositeScore = titleJaccard * 0.45 + entityScore * 0.35 + contentJaccard * 0.20;

  // Bonus: If title similarity is very high (>0.6) or both share multiple prominent entities
  if (titleJaccard >= 0.55) {
    compositeScore = Math.min(1.0, compositeScore + 0.15);
  }

  return compositeScore;
}

const CLUSTERING_SIMILARITY_THRESHOLD = 0.40;

/**
 * Assigns a NewsItem to an existing StoryCluster or seeds a new one
 */
export async function assignItemToCluster(newsItemId: string): Promise<string> {
  const item = await prisma.newsItem.findUnique({
    where: { id: newsItemId },
    include: { source: true },
  });

  if (!item) throw new Error(`NewsItem ${newsItemId} not found`);

  // Look for active clusters created/updated within the last 48 hours
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const candidateClusters = await prisma.storyCluster.findMany({
    where: {
      lastSeenAt: { gte: twoDaysAgo },
      status: { in: ['PENDING', 'ACTIVE'] },
    },
    include: {
      items: {
        include: { source: true },
      },
    },
  });

  let bestClusterId: string | null = null;
  let highestScore = 0;

  for (const cluster of candidateClusters) {
    for (const clusterItem of cluster.items) {
      const score = computeStorySimilarity(
        {
          title: item.title,
          description: item.description,
          publishedAt: item.publishedAt,
          categoryId: item.categoryId,
        },
        {
          title: clusterItem.title,
          description: clusterItem.description,
          publishedAt: clusterItem.publishedAt,
          categoryId: clusterItem.categoryId,
        }
      );

      if (score > highestScore && score >= CLUSTERING_SIMILARITY_THRESHOLD) {
        highestScore = score;
        bestClusterId = cluster.id;
      }
    }
  }

  if (bestClusterId) {
    // Add item to existing cluster and update cluster metadata
    await prisma.newsItem.update({
      where: { id: item.id },
      data: { clusterId: bestClusterId },
    });

    const allClusterItems = await prisma.newsItem.findMany({
      where: { clusterId: bestClusterId },
      include: { source: true },
    });

    const uniqueSources = new Set(allClusterItems.map((i) => i.sourceId));
    const maxImportance = Math.max(...allClusterItems.map((i) => i.importanceScore || 50));
    const maxTrending = Math.max(...allClusterItems.map((i) => i.trendingScore || 0));
    const anyBreaking = allClusterItems.some((i) => i.isBreaking);

    await prisma.storyCluster.update({
      where: { id: bestClusterId },
      data: {
        sourceCount: uniqueSources.size,
        lastSeenAt: new Date(),
        importanceScore: maxImportance,
        trendingScore: Math.min(100, maxTrending + uniqueSources.size * 5),
        isBreaking: anyBreaking,
        status: 'ACTIVE',
      },
    });

    return bestClusterId;
  }

  // Create new seed cluster
  const cleanTitle = item.title.trim();
  let baseSlug = slugify(cleanTitle, { lower: true, strict: true, trim: true }) || 'story-cluster';
  baseSlug = `${baseSlug.slice(0, 60)}-${Math.floor(1000 + Math.random() * 9000)}`;

  const newCluster = await prisma.storyCluster.create({
    data: {
      title: cleanTitle,
      canonicalTitle: cleanTitle,
      slug: baseSlug,
      summary: item.description || cleanTitle,
      categoryId: item.categoryId,
      status: 'PENDING',
      sourceCount: 1,
      confidenceScore: 1.0,
      importanceScore: item.importanceScore || 50,
      trendingScore: item.trendingScore || 20,
      breakingScore: item.breakingScore || 0,
      isBreaking: item.isBreaking,
      canonicalNewsItemId: item.id,
      leadImageUrl: item.imageUrl,
    },
  });

  await prisma.newsItem.update({
    where: { id: item.id },
    data: { clusterId: newCluster.id },
  });

  return newCluster.id;
}

/**
 * Runs batch clustering across all unassigned NewsItems
 */
export async function clusterUnassignedNewsItems(): Promise<{ processed: number; clustersCreated: number }> {
  const unassigned = await prisma.newsItem.findMany({
    where: { clusterId: null },
    orderBy: { publishedAt: 'desc' },
  });

  let clustersCreated = 0;
  for (const item of unassigned) {
    const clusterId = await assignItemToCluster(item.id);
    if (clusterId) {
      clustersCreated++;
    }
  }

  return {
    processed: unassigned.length,
    clustersCreated,
  };
}
