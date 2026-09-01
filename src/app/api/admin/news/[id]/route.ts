import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { Prisma } from '@prisma/client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await prisma.newsItem.findUnique({
      where: { id },
      include: {
        source: true,
        category: true,
        drafts: true,
      },
    });

    if (!item) {
      return NextResponse.json({ error: 'News item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
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
    const { status, internalNotes, checklist, categoryId } = body;

    const dataToUpdate: Prisma.NewsItemUpdateInput = {};

    if (status) {
      // Disallow direct publishing via raw news item
      if (status === 'PUBLISHED') {
        return NextResponse.json(
          { error: 'News items must be drafted and approved before publishing.' },
          { status: 400 }
        );
      }
      dataToUpdate.status = status.toUpperCase();
    }

    if (internalNotes !== undefined) dataToUpdate.internalNotes = internalNotes;
    if (checklist !== undefined) {
      dataToUpdate.checklist = typeof checklist === 'string' ? checklist : JSON.stringify(checklist);
    }
    if (categoryId !== undefined) {
      dataToUpdate.category = categoryId ? { connect: { id: categoryId } } : { disconnect: true };
    }

    const updated = await prisma.newsItem.update({
      where: { id },
      data: dataToUpdate,
      include: { source: true, category: true, drafts: true },
    });

    if (status) {
      await recordActivity(
        `news_status_${status.toLowerCase()}`,
        updated.title,
        `Status changed to ${status}`,
        session.user || 'Admin'
      );
    }

    return NextResponse.json({ success: true, item: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
