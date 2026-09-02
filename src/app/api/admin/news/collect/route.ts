import { NextResponse } from 'next/server';
import { runNewsCollectionJob } from '@/lib/news/jobRunner';
import { getAdminSession, recordActivity } from '@/lib/auth';

export async function POST() {
  try {
    const session = await getAdminSession();
    const result = await runNewsCollectionJob({ trigger: 'manual' });

    if (result.skipped) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: 'A news collection job is already running in the background.',
        data: result,
      });
    }

    await recordActivity(
      'news_collected',
      'manual_pipeline',
      `Manual news collection: ${result.newItems} new items, ${result.duplicates} duplicates from ${result.sourcesProcessed} sources.`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: result.success,
      message: 'News collection completed successfully',
      data: result,
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
