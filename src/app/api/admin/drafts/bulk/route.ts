import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { revalidateNewsPublication } from '@/lib/cache/revalidateNews';

export async function POST(request: Request) {
  try {
    if (action === 'publish') {
      const drafts = await prisma.articleDraft.findMany({
        where: { id: { in: ids } },
        include: { category: true, newsItem: true },
      });

      let publishedCount = 0;
      const revalidationPromises: Promise<void>[] = [];

      for (const draft of drafts) {
        const publishedAt = draft.publishedAt || new Date();

        await prisma.articleDraft.update({
          where: { id: draft.id },
          data: {
            status: 'PUBLISHED',
            publishedAt,
          },
        });

        if (draft.newsItemId) {
          await prisma.newsItem.update({
            where: { id: draft.newsItemId },
            data: { status: 'PUBLISHED' },
          });
        }

        publishedCount++;
        revalidationPromises.push(
          revalidateNewsPublication({
            categorySlug: draft.category?.slug,
            slug: draft.slug,
          })
        );
      }

      await Promise.all(revalidationPromises);

      await recordActivity(
        'bulk_drafts_publish',
        `${publishedCount} articles`,
        `Batch published ${publishedCount} drafts to public site`,
        session.user || 'Admin'
      );

      return NextResponse.json({
        success: true,
        count: publishedCount,
        status: 'PUBLISHED',
      });
    }

    if (action === 'delete') {
      const deleteResult = await prisma.articleDraft.deleteMany({
        where: { id: { in: ids } },
      });

      await recordActivity(
        'bulk_drafts_delete',
        `${deleteResult.count} drafts`,
        `Batch deleted ${deleteResult.count} drafts`,
        session.user || 'Admin'
      );

      return NextResponse.json({
        success: true,
        count: deleteResult.count,
      });
    }

    let newStatus: string;
    if (action === 'approve') newStatus = 'APPROVED';
    else if (action === 'review') newStatus = 'REVIEW';
    else if (action === 'archive') newStatus = 'ARCHIVED';
    else if (action === 'draft') newStatus = 'DRAFT';
    else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updateResult = await prisma.articleDraft.updateMany({
      where: { id: { in: ids } },
      data: { status: newStatus },
    });

    await recordActivity(
      `bulk_drafts_${action}`,
      `${ids.length} drafts`,
      `Updated ${updateResult.count} drafts to ${newStatus}`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      count: updateResult.count,
      status: newStatus,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Bulk draft action failed';
    console.error('Error in bulk draft action:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
