import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { Prisma } from '@prisma/client';
import slugify from 'slugify';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const draft = await prisma.articleDraft.findUnique({
      where: { id },
      include: {
        category: true,
        newsItem: {
          include: { source: true },
        },
      },
    });

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    return NextResponse.json(draft);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    const { id } = await params;
    const body = await request.json();

    const existingDraft = await prisma.articleDraft.findUnique({ where: { id } });
    if (!existingDraft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const dataToUpdate: Prisma.ArticleDraftUpdateInput = {};

    // Fields to update if present in body
    if (body.title !== undefined) dataToUpdate.title = body.title;
    if (body.excerpt !== undefined) dataToUpdate.excerpt = body.excerpt;
    if (body.content !== undefined) dataToUpdate.content = body.content;
    if (body.categoryId !== undefined) {
      dataToUpdate.category = body.categoryId ? { connect: { id: body.categoryId } } : { disconnect: true };
    }
    if (body.authorName !== undefined) dataToUpdate.authorName = body.authorName;
    if (body.featuredImage !== undefined) dataToUpdate.featuredImage = body.featuredImage;
    if (body.imageAlt !== undefined) dataToUpdate.imageAlt = body.imageAlt;
    if (body.seoTitle !== undefined) dataToUpdate.seoTitle = body.seoTitle;
    if (body.metaDescription !== undefined) dataToUpdate.metaDescription = body.metaDescription;
    if (body.canonicalUrl !== undefined) dataToUpdate.canonicalUrl = body.canonicalUrl;
    if (body.internalNotes !== undefined) dataToUpdate.internalNotes = body.internalNotes;
    if (body.readingTime !== undefined) dataToUpdate.readingTime = body.readingTime;
    if (body.featured !== undefined) dataToUpdate.featured = body.featured;
    if (body.breaking !== undefined) dataToUpdate.breaking = body.breaking;

    // Status (allow changing between DRAFT, REVIEW, APPROVED, ARCHIVED, but PUBLISHED must go through publish endpoint)
    if (body.status !== undefined) {
      if (body.status === 'PUBLISHED' && existingDraft.status !== 'PUBLISHED') {
        return NextResponse.json(
          { error: 'Please use the Publish action with pre-flight checklist validation.' },
          { status: 400 }
        );
      }
      dataToUpdate.status = body.status;
    }

    // Slug validation and uniqueness
    if (body.slug !== undefined && body.slug !== existingDraft.slug) {
      const cleanSlug = slugify(body.slug, { lower: true, strict: true, trim: true });
      const duplicate = await prisma.articleDraft.findFirst({
        where: { slug: cleanSlug, NOT: { id } },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: `Slug "${cleanSlug}" is already in use by another article.` },
          { status: 409 }
        );
      }
      dataToUpdate.slug = cleanSlug;
    }

    // JSON fields stringification
    if (body.tags !== undefined) {
      dataToUpdate.tags = typeof body.tags === 'string' ? body.tags : JSON.stringify(body.tags);
    }
    if (body.sources !== undefined) {
      dataToUpdate.sources = typeof body.sources === 'string' ? body.sources : JSON.stringify(body.sources);
    }
    if (body.quickSummary !== undefined) {
      dataToUpdate.quickSummary = typeof body.quickSummary === 'string' ? body.quickSummary : JSON.stringify(body.quickSummary);
    }
    if (body.whatYouNeedToKnow !== undefined) {
      dataToUpdate.whatYouNeedToKnow = typeof body.whatYouNeedToKnow === 'string' ? body.whatYouNeedToKnow : JSON.stringify(body.whatYouNeedToKnow);
    }
    if (body.timeline !== undefined) {
      dataToUpdate.timeline = typeof body.timeline === 'string' ? body.timeline : JSON.stringify(body.timeline);
    }

    const updated = await prisma.articleDraft.update({
      where: { id },
      data: dataToUpdate,
      include: { category: true, newsItem: { include: { source: true } } },
    });

    await recordActivity(
      'draft_updated',
      updated.title,
      `Draft "${updated.title}" saved`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, draft: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    console.error('Error updating draft:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    const { id } = await params;

    const draft = await prisma.articleDraft.findUnique({ where: { id } });
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    await prisma.articleDraft.delete({ where: { id } });

    await recordActivity(
      'draft_deleted',
      draft.title,
      `Draft "${draft.title}" was permanently deleted`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, message: 'Draft deleted successfully' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Delete failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
