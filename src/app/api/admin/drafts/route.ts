import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search')?.trim();

    const where: Prisma.ArticleDraftWhereInput = {};

    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (category && category !== 'all') {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { authorName: { contains: search } },
      ];
    }

    const drafts = await prisma.articleDraft.findMany({
      where,
      include: {
        category: true,
        newsItem: {
          include: { source: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ drafts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch drafts';
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { newsItemId, title, categoryId } = body;

    let initialTitle = title || 'Untitled Article Draft';
    let initialExcerpt = '';
    let initialContent = '';
    let initialImage = '';
    let initialImageAlt = '';
    let initialCatId = categoryId;
    let initialSources: { name: string; url: string }[] = [];
    let initialQuickSummary: string[] = [];

    // If creating from a news item, populate from source news item
    if (newsItemId) {
      const newsItem = await prisma.newsItem.findUnique({
        where: { id: newsItemId },
        include: { source: true, category: true },
      });

      if (newsItem) {
        initialTitle = newsItem.title;
        initialExcerpt = newsItem.description || '';
        initialContent = `## What Happened\n\n${newsItem.description || ''}\n\n## Key Details\n\nReported by ${newsItem.source.name}.\n\n## Why It Matters\n\n`;
        initialImage = newsItem.imageUrl || '';
        initialImageAlt = newsItem.imageAlt || newsItem.title;
        initialCatId = initialCatId || newsItem.categoryId;
        initialSources = [
          { name: newsItem.source.name, url: newsItem.originalUrl },
        ];
        initialQuickSummary = [
          newsItem.title,
          `Original reporting by ${newsItem.source.name}`,
        ];

        // Update news item status to APPROVED or REVIEW if discovered
        if (newsItem.status === 'DISCOVERED') {
          await prisma.newsItem.update({
            where: { id: newsItemId },
            data: { status: 'REVIEW' },
          });
        }
      }
    }

    // Generate clean unique slug
    const baseSlug = slugify(initialTitle, { lower: true, strict: true, trim: true }) || 'untitled-draft';
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.articleDraft.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const draft = await prisma.articleDraft.create({
      data: {
        newsItemId: newsItemId || null,
        title: initialTitle,
        slug,
        excerpt: initialExcerpt,
        content: initialContent,
        categoryId: initialCatId || null,
        authorName: session.user || 'THE BRIEF Editorial Team',
        featuredImage: initialImage,
        imageAlt: initialImageAlt,
        status: 'DRAFT',
        seoTitle: `${initialTitle} — THE BRIEF`,
        metaDescription: initialExcerpt ? initialExcerpt.slice(0, 155) : '',
        sources: JSON.stringify(initialSources),
        quickSummary: JSON.stringify(initialQuickSummary),
        tags: JSON.stringify(['News']),
      },
      include: {
        category: true,
        newsItem: { include: { source: true } },
      },
    });

    await recordActivity(
      'draft_created',
      draft.title,
      `Draft created with slug "${draft.slug}"`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, draft });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create draft';
    console.error('Error creating draft:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
