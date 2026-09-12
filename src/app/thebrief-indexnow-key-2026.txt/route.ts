import { INDEXNOW_KEY } from '@/lib/seo/indexNow';

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
