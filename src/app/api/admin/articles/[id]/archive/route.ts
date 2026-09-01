import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    const { id } = await params;
    const body = await request.json();
    const { action } = body; // 'archive' or 'unpublish'

    const targetStatus = action === 'unpublish' ? 'DRAFT' : 'ARCHIVED';

    const updated = await prisma.articleDraft.update({
      where: { id },
      data: { status: targetStatus },
      include: { category: true },
    });

    try {
      revalidatePath('/');
      revalidatePath('/daily-news');
      if (updated.category?.slug) {
        revalidatePath(`/${updated.category.slug}`);
      }
    } catch {}

    await recordActivity(
      `article_${targetStatus.toLowerCase()}`,
      updated.title,
      `Article set to ${targetStatus}`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, article: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Action failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
