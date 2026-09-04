import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { draftId, action, readTimeSec } = body;

    if (!draftId) {
      return NextResponse.json({ success: false, error: 'draftId is required' }, { status: 400 });
    }

    // Upsert ArticleAnalytics
    const analytics = await prisma.articleAnalytics.upsert({
      where: { draftId },
      update: {
        views: action === 'view' ? { increment: 1 } : undefined,
        shares: action === 'share' ? { increment: 1 } : undefined,
        sourceClicks: action === 'source_click' ? { increment: 1 } : undefined,
        avgReadTimeSec: readTimeSec ? Math.round(readTimeSec) : undefined,
      },
      create: {
        draftId,
        views: action === 'view' ? 1 : 0,
        shares: action === 'share' ? 1 : 0,
        sourceClicks: action === 'source_click' ? 1 : 0,
        avgReadTimeSec: readTimeSec ? Math.round(readTimeSec) : 0,
      },
    });

    return NextResponse.json({ success: true, analytics });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown analytics error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
