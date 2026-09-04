import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import slugify from 'slugify';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const minSources = parseInt(searchParams.get('minSources') || '1', 10);
    const search = searchParams.get('search')?.toLowerCase();

    const where: Record<string, unknown> = {
      sourceCount: { gte: minSources },
    };

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (category && category !== 'ALL') {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { canonicalTitle: { contains: search } },
        { summary: { contains: search } },
      ];
    }

    const clusters = await prisma.storyCluster.findMany({
      where,
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
      take: 50,
    });

    return NextResponse.json({
      success: true,
      clusters: clusters.map((c) => ({
        id: c.id,
        title: c.title,
        canonicalTitle: c.canonicalTitle || c.title,
        slug: c.slug,
        summary: c.summary,
        category: c.category?.name || 'General',
        categorySlug: c.category?.slug || 'news',
        status: c.status,
        sourceCount: c.sourceCount,
        importanceScore: c.importanceScore,
        trendingScore: c.trendingScore,
        isBreaking: c.isBreaking,
        sources: Array.from(new Set(c.items.map((i) => i.source?.name).filter(Boolean))),
        itemCount: c.items.length,
        leadImageUrl: c.leadImageUrl || c.items.find((i) => i.imageUrl)?.imageUrl,
        firstSeenAt: c.firstSeenAt,
        lastSeenAt: c.lastSeenAt,
        draft: c.drafts[0] || null,
      })),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, summary, categoryId, itemIds } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const slug = `${slugify(title, { lower: true, strict: true, trim: true })}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cluster = await prisma.storyCluster.create({
      data: {
        title,
        canonicalTitle: title,
        slug,
        summary,
        categoryId,
        status: 'ACTIVE',
        sourceCount: itemIds?.length || 1,
      },
    });

    if (Array.isArray(itemIds) && itemIds.length > 0) {
      await prisma.newsItem.updateMany({
        where: { id: { in: itemIds } },
        data: { clusterId: cluster.id },
      });
    }

    return NextResponse.json({ success: true, cluster });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
