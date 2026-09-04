import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const cluster = await prisma.storyCluster.findUnique({
      where: { id },
      include: {
        category: true,
        items: {
          include: { source: true },
          orderBy: { publishedAt: 'desc' },
        },
        drafts: true,
      },
    });

    if (!cluster) {
      return NextResponse.json({ success: false, error: 'Cluster not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, cluster });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, summary, status, isBreaking, categoryId } = body;

    const updated = await prisma.storyCluster.update({
      where: { id },
      data: {
        title: title !== undefined ? title : undefined,
        canonicalTitle: title !== undefined ? title : undefined,
        summary: summary !== undefined ? summary : undefined,
        status: status !== undefined ? status : undefined,
        isBreaking: isBreaking !== undefined ? isBreaking : undefined,
        categoryId: categoryId !== undefined ? categoryId : undefined,
      },
    });

    return NextResponse.json({ success: true, cluster: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Props) {
  try {
    const { id } = await params;

    // Disband cluster: unlink all news items without deleting them
    await prisma.newsItem.updateMany({
      where: { clusterId: id },
      data: { clusterId: null },
    });

    await prisma.storyCluster.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, disbanded: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
