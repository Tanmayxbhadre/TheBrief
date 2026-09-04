import React from 'react';
import { prisma } from '@/lib/db';
import { ClusterManager, StoryClusterItem } from '@/components/admin/ClusterManager';

export const dynamic = 'force-dynamic';

export default async function AdminClustersPage() {
  const [categories, clusters] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.storyCluster.findMany({
      include: {
        category: true,
        items: {
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
        },
        drafts: {
          select: { id: true, slug: true, status: true, title: true },
        },
      },
      orderBy: [{ importanceScore: 'desc' }, { lastSeenAt: 'desc' }],
      take: 60,
    }),
  ]);

  const mappedClusters: StoryClusterItem[] = clusters.map((c) => ({
    id: c.id,
    title: c.title,
    canonicalTitle: c.canonicalTitle || c.title,
    slug: c.slug,
    summary: c.summary || undefined,
    category: c.category?.name || 'General',
    categorySlug: c.category?.slug || 'news',
    status: c.status,
    sourceCount: c.sourceCount,
    importanceScore: c.importanceScore,
    trendingScore: c.trendingScore,
    isBreaking: c.isBreaking,
    sources: Array.from(new Set(c.items.map((i) => i.source?.name).filter(Boolean))),
    itemCount: c.items.length,
    leadImageUrl: c.leadImageUrl || c.items.find((i) => i.imageUrl)?.imageUrl || undefined,
    firstSeenAt: c.firstSeenAt.toISOString(),
    lastSeenAt: c.lastSeenAt.toISOString(),
    draft: c.drafts[0] || null,
  }));

  return (
    <ClusterManager
      initialClusters={mappedClusters}
      categories={categories}
    />
  );
}
