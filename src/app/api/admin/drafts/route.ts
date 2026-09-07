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
    const filter = searchParams.get('filter'); // needs_review | high_quality | low_confidence | sensitive | breaking | recently_created
    const search = searchParams.get('search')?.trim();

    const where: Prisma.ArticleDraftWhereInput = {};

    if (status && status !== 'all' && status !== 'all_drafts' && status !== 'any') {
      where.status = status.toUpperCase();
    } else if (status === 'any') {
      // Truly unrestricted — returns every record (admin debug use)
    } else {
      // Default / 'all' / 'all_drafts': return active editorial pipeline only
      // Never show PUBLISHED, REJECTED, or ARCHIVED in the Drafts work queue
      where.status = { in: ['DRAFT', 'REVIEW', 'APPROVED'] };
    }

    if (category && category !== 'all') {
      where.category = { slug: category };
    }

    // Specialized Editorial Filters
    if (filter === 'needs_review') {
      where.status = { in: ['DRAFT', 'REVIEW'] };
    } else if (filter === 'high_quality') {
      where.aiQualityScore = { gte: 90 };
    } else if (filter === 'low_confidence') {
      where.publishConfidence = { lt: 90 };
    } else if (filter === 'sensitive') {
      where.OR = [
        { internalNotes: { contains: '"isSensitive":true' } },
        { internalNotes: { contains: 'Sensitive topic' } },
        { category: { slug: { in: ['politics', 'legal', 'crime', 'emergency', 'defense', 'military'] } } },
      ];
    } else if (filter === 'breaking') {
      where.breaking = true;
    }

    if (search) {
      where.AND = [
        {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
            { authorName: { contains: search } },
          ],
        },
      ];
    }

    let orderBy: Prisma.ArticleDraftOrderByWithRelationInput = { updatedAt: 'desc' };
    if (filter === 'recently_created') {
      orderBy = { createdAt: 'desc' };
    }

    const drafts = await prisma.articleDraft.findMany({
      where,
      include: {
        category: true,
        newsItem: {
          include: { source: true },
        },
      },
      orderBy,
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
