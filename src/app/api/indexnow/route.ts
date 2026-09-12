import { NextResponse } from 'next/server';
import { INDEXNOW_KEY, submitToIndexNow } from '@/lib/seo/indexNow';

export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(INDEXNOW_KEY, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const urls = body.urls || [];
    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'urls array required' }, { status: 400 });
    }

    const success = await submitToIndexNow(urls);
    return NextResponse.json({ success, submitted: urls.length });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
