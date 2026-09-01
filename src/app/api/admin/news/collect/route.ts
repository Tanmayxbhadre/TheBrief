import { NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news/collector';
import { getAdminSession, recordActivity } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAdminSession();
    const summary = await collectAllNews();

    await recordActivity(
      'news_collected',
      'rss_pipeline',
      `Manual collection triggered: ${summary.newItems} new items, ${summary.duplicates} duplicates from ${summary.sourcesProcessed} sources.`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      message: 'News collection completed successfully',
      data: summary,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in admin news collection endpoint:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
