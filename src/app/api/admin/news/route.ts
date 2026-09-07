import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const sourceId = searchParams.get('sourceId');
    const dateFilter = searchParams.get('date');
    const sort = searchParams.get('sort') || 'newest_discovered';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '25', 10), 100);
    const skip = (page - 1) * limit;

    const where: Prisma.NewsItemWhereInput = {};

    // Status filter
    // Default (no param or 'queue'): show only actionable editorial states — exclude
    // PUBLISHED, REJECTED, ARCHIVED since those require no newsroom action.
    // 'all' is an explicit override that returns every record.
    if (!status || status === 'queue') {
      where.status = { notIn: ['PUBLISHED', 'REJECTED', 'ARCHIVED'] };
    } else if (status !== 'all') {
      where.status = status.toUpperCase();
    }
    // status === 'all' → no filter (full visibility)

    // Category filter
    if (category && category !== 'all') {
      where.category = { slug: category };
    }

    // Source filter
    if (sourceId && sourceId !== 'all') {
      where.sourceId = sourceId;
    }

    // Date filter
    if (dateFilter && dateFilter !== 'all') {
      const now = new Date();
      if (dateFilter === 'today') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.discoveredAt = { gte: startOfDay };
      } else if (dateFilter === 'yesterday') {
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
        const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        where.discoveredAt = { gte: startOfYesterday, lt: endOfYesterday };
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        where.discoveredAt = { gte: sevenDaysAgo };
      }
    }

    // Search query (headline, description, author)
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { author: { contains: search } },
        { source: { name: { contains: search } } },
      ];
    }

    // Sorting
    let orderBy: Prisma.NewsItemOrderByWithRelationInput = { discoveredAt: 'desc' };
    if (sort === 'oldest_discovered') orderBy = { discoveredAt: 'asc' };
    else if (sort === 'newest_published') orderBy = { publishedAt: 'desc' };
    else if (sort === 'oldest_published') orderBy = { publishedAt: 'asc' };
    else if (sort === 'newest_updated') orderBy = { updatedAt: 'desc' };

    const [total, items] = await Promise.all([
      prisma.newsItem.count({ where }),
      prisma.newsItem.findMany({
        where,
        include: {
          source: true,
          category: true,
          cluster: {
            select: { id: true, title: true, sourceCount: true },
          },
          drafts: {
            select: { id: true, title: true, status: true, slug: true },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch news';
    console.error('Error fetching admin news:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { action, ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No news items selected' }, { status: 400 });
    }

    // Handle Bulk Publishing
    if (action === 'publish' || action === 'PUBLISHED') {
      const items = await prisma.newsItem.findMany({
        where: { id: { in: ids } },
        include: {
          source: true,
          category: true,
          drafts: true,
        },
      });

      let publishedCount = 0;
      const revalidationPromises: Promise<void>[] = [];

      for (const item of items) {
        let publishedSlug = '';
        const categorySlug = item.category?.slug || 'general';

        if (item.drafts && item.drafts.length > 0) {
          const draft = item.drafts[0];
          publishedSlug = draft.slug;

          await prisma.articleDraft.update({
            where: { id: draft.id },
            data: {
              status: 'PUBLISHED',
              publishedAt: draft.publishedAt || new Date(),
              content: draft.content?.trim() || `## What Happened\n\n${item.description || item.title}\n\n## Key Details\n\nOriginal reporting and verification provided by ${item.source.name}.\n\n## Why It Matters\n\nFollow THE BRIEF for ongoing editorial updates and verified global coverage.`,
              excerpt: draft.excerpt?.trim() || item.description || item.title,
              authorName: draft.authorName || session.user || 'THE BRIEF Editorial Desk',
              seoTitle: draft.seoTitle || `${item.title} — THE BRIEF`,
              metaDescription: draft.metaDescription || (item.description || item.title).slice(0, 155),
              sources: draft.sources || JSON.stringify([{ name: item.source.name, url: item.originalUrl }]),
              quickSummary: draft.quickSummary || JSON.stringify([item.title, `Original coverage by ${item.source.name}`]),
            },
          });
        } else {
          // Generate unique slug
          const baseSlug = slugify(item.title, { lower: true, strict: true, trim: true }) || `news-item-${Date.now()}`;
          let slug = baseSlug;
          let counter = 1;
          while (await prisma.articleDraft.findUnique({ where: { slug } })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
          }
          publishedSlug = slug;

          await prisma.articleDraft.create({
            data: {
              newsItemId: item.id,
              title: item.title,
              slug,
              excerpt: item.description || item.title,
              content: `## What Happened\n\n${item.description || item.title}\n\n## Key Details\n\nOriginal reporting provided by ${item.source.name}.\n\n## Why It Matters\n\nFollow THE BRIEF for real-time journalistic verification and in-depth reporting.`,
              categoryId: item.categoryId || null,
              authorName: session.user || 'THE BRIEF Editorial Desk',
              featuredImage: item.imageUrl || '',
              imageAlt: item.imageAlt || item.title,
              status: 'PUBLISHED',
              publishedAt: item.publishedAt || new Date(),
              seoTitle: `${item.title} — THE BRIEF`,
              metaDescription: (item.description || item.title).slice(0, 155),
              sources: JSON.stringify([{ name: item.source.name, url: item.originalUrl }]),
              quickSummary: JSON.stringify([item.title, `Original reporting by ${item.source.name}`]),
              tags: JSON.stringify(['News', item.category?.name || 'General']),
            },
          });
        }

        // Update news item status to PUBLISHED
        await prisma.newsItem.update({
          where: { id: item.id },
          data: { status: 'PUBLISHED' },
        });

        publishedCount++;
        revalidationPromises.push(
          revalidateNewsPublication({ categorySlug, slug: publishedSlug })
        );
      }

      await Promise.all(revalidationPromises);

      await recordActivity(
        'bulk_news_publish',
        `${publishedCount} articles`,
        `Batch published ${publishedCount} news items directly to the public website`,
        session.user || 'Admin'
      );

      return NextResponse.json({
        success: true,
        count: publishedCount,
        status: 'PUBLISHED',
      });
    }

    let newStatus: string;
    if (action === 'review') newStatus = 'REVIEW';
    else if (action === 'approve') newStatus = 'APPROVED';
    else if (action === 'reject') newStatus = 'REJECTED';
    else if (action === 'archive') newStatus = 'ARCHIVED';
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateResult = await prisma.newsItem.updateMany({
      where: { id: { in: ids } },
      data: { status: newStatus },
    });

    await recordActivity(
      `bulk_news_${action}`,
      `${ids.length} news items`,
      `Updated ${updateResult.count} items to ${newStatus}`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      status: newStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Action failed';
    console.error('Error in bulk news action:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
