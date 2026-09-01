import { NextResponse } from 'next/server';
import { collectAllNews } from '@/lib/news/collector';

// Note: In Next.js App Router, configuring maxDuration or similar depends on your host (e.g. Vercel)
// export const maxDuration = 300; // 5 minutes

export async function POST(request: Request) {
  try {
    // Basic protection using an environment variable
    const authHeader = request.headers.get('authorization');
    const adminSecret = process.env.ADMIN_SECRET;

    if (!adminSecret) {
      console.warn('ADMIN_SECRET is not configured. Collection is open.');
    } else {
      if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const summary = await collectAllNews();
    
    return NextResponse.json({
      success: true,
      message: 'News collection completed successfully',
      data: summary
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal Server Error';
    console.error('Error in news collection endpoint:', error);
    return NextResponse.json(
      { success: false, error: msg },
      { status: 500 }
    );
  }
}
