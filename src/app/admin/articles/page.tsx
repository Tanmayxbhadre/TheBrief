import React from 'react';
import { prisma } from '@/lib/db';
import { PublishedArticlesList } from '@/components/admin/PublishedArticlesList';

export const dynamic = 'force-dynamic';

export default async function AdminArticlesPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  return <PublishedArticlesList initialCategories={categories} />;
}
