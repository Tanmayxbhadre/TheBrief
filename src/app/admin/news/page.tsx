import React from 'react';
import { prisma } from '@/lib/db';
import { AdminNewsQueue } from '@/components/admin/AdminNewsQueue';

export const dynamic = 'force-dynamic';

export default async function AdminNewsPage() {
  const [categories, sources] = await Promise.all([
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
    prisma.source.findMany({
      select: { id: true, name: true },
      orderBy: { priority: 'asc' },
    }),
  ]);

  return (
    <AdminNewsQueue
      initialCategories={categories}
      initialSources={sources}
    />
  );
}
