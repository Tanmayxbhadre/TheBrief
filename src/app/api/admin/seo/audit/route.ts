import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auditArticleSeo } from '@/lib/seo/audit';
import { optimizeArticleSeo } from '@/lib/seo/optimizer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const publishedDrafts = await prisma.articleDraft.findMany({
      where: { status: 'PUBLISHED' },
      include: { category: true },
      orderBy: { publishedAt: 'desc' },
      take: 15,
    });

    const audits = publishedDrafts.map((d) => {
      const audit = auditArticleSeo({
        title: d.title,
        slug: d.slug,
        excerpt: d.excerpt,
        content: d.content,
        seoTitle: d.seoTitle,
        metaDescription: d.metaDescription,
        categorySlug: d.category?.slug,
        authorName: d.authorName,
        featuredImage: d.featuredImage,
        imageAlt: d.imageAlt,
        sources: d.sources,
        quickSummary: d.quickSummary,
        whatYouNeedToKnow: d.whatYouNeedToKnow,
        tags: d.tags,
      });

      return {
        id: d.id,
        title: d.title,
        slug: d.slug,
        category: d.category?.name || 'General',
        seoScore: audit.score,
        grade: audit.grade,
        isRankReady: audit.isRankReady,
        criticalCount: audit.criticalCount,
        warningCount: audit.warningCount,
        publishedAt: d.publishedAt,
      };
    });

    const avgScore = audits.length
      ? Math.round(audits.reduce((acc, a) => acc + a.seoScore, 0) / audits.length)
      : 100;

    return NextResponse.json({
      success: true,
      siteHealth: {
        averageSeoScore: avgScore,
        totalAudited: audits.length,
        rankReadyCount: audits.filter((a) => a.isRankReady).length,
      },
      articles: audits,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SEO audit failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draftId, article, autoOptimize } = body;

    let targetArticle = article;

    if (draftId && !targetArticle) {
      const draft = await prisma.articleDraft.findUnique({
        where: { id: draftId },
        include: { category: true },
      });

      if (!draft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
      }

      targetArticle = {
        title: draft.title,
        slug: draft.slug,
        excerpt: draft.excerpt,
        content: draft.content,
        seoTitle: draft.seoTitle,
        metaDescription: draft.metaDescription,
        categorySlug: draft.category?.slug,
        authorName: draft.authorName,
        featuredImage: draft.featuredImage,
        imageAlt: draft.imageAlt,
        sources: draft.sources,
        quickSummary: draft.quickSummary,
        whatYouNeedToKnow: draft.whatYouNeedToKnow,
        tags: draft.tags,
      };
    }

    if (!targetArticle) {
      return NextResponse.json({ error: 'Provide either draftId or article object' }, { status: 400 });
    }

    if (autoOptimize) {
      const optimized = optimizeArticleSeo(targetArticle);
      if (draftId) {
        await prisma.articleDraft.update({
          where: { id: draftId },
          data: {
            seoTitle: optimized.seoTitle,
            metaDescription: optimized.metaDescription,
            canonicalUrl: optimized.canonicalUrl,
            imageAlt: optimized.imageAlt,
            tags: JSON.stringify(optimized.tags),
          },
        });
      }
      return NextResponse.json({
        success: true,
        optimized: true,
        fields: optimized,
        audit: optimized.auditResult,
      });
    }

    const audit = auditArticleSeo(targetArticle);
    return NextResponse.json({
      success: true,
      audit,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to audit article';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
