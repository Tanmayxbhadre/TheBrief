import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import { StoryDetailInspector } from '@/components/admin/StoryDetailInspector';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminStoryDetailPage({ params }: Props) {
  const { id } = await params;

  const item = await prisma.newsItem.findUnique({
    where: { id },
    include: {
      source: true,
      category: true,
      drafts: {
        select: { id: true, title: true, status: true, slug: true },
      },
    },
  });

  if (!item) {
    notFound();
  }

  return <StoryDetailInspector item={item} />;
}
