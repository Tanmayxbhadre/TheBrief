import { NextResponse } from 'next/server';
import { runNewsCollectionJob } from '@/lib/news/jobRunner';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;
    const cronSecret = process.env.CRON_SECRET;

    const isAuthorized =
      (adminSecret && authHeader === `Bearer ${adminSecret}`) ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`);

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await runNewsCollectionJob({ trigger: 'webhook' });

    return NextResponse.json({
      success: result.success,
      message: result.skipped ? 'Collection job currently running' : 'News collection completed successfully',
      data: result,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in webhook news collection endpoint:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
