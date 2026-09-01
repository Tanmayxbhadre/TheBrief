import React from 'react';
import { prisma } from '@/lib/db';
import { DraftsList } from '@/components/admin/DraftsList';

export const dynamic = 'force-dynamic';

export default async function AdminDraftsPage() {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: 'asc' },
  });

  return <DraftsList initialCategories={categories} />;
}
