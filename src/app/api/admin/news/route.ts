import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { Prisma } from '@prisma/client';

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

    // Explicitly reject bulk publish attempts
    if (action === 'publish' || action === 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Bulk publishing is not permitted for editorial safety.' },
        { status: 403 }
      );
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
