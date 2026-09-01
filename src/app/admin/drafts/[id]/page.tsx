import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { ArticleEditor } from '@/components/admin/ArticleEditor';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminDraftEditorPage({ params }: Props) {
  const { id } = await params;

  const [draft, categories] = await Promise.all([
    prisma.articleDraft.findUnique({
      where: { id },
      include: {
        category: true,
        newsItem: {
          include: { source: true },
        },
      },
    }),
    prisma.category.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  if (!draft) {
    notFound();
  }

  return <ArticleEditor initialDraft={draft} categories={categories} />;
}
