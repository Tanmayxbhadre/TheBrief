import { NextResponse } from 'next/server';
import { generateDraftForCluster } from '@/lib/ai/articleGenerationWorker';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const user = body.user || 'Admin Editor';

    const draftId = await generateDraftForCluster(id, user);

    return NextResponse.json({
      success: true,
      draftId,
      message: 'Synthesized article draft generated successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown synthesis error';
    console.error('[CLUSTER-SYNTHESIS] Error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
