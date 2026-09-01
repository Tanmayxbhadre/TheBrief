import { NextResponse } from 'next/server';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { aiService } from '@/lib/ai/service';
import { ImproveRequest } from '@/lib/ai/types';

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as ImproveRequest;
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    const aiResponse = await aiService.improve(body, session.user || 'Admin Editor');

    await recordActivity(
      'ai_improved',
      body.title || `Action: ${action}`,
      `Performed AI improvement (${action})`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      action: aiResponse.action,
      result: aiResponse.result,
      usage: aiResponse.usage,
      provider: aiResponse.provider,
      model: aiResponse.model,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Improvement failed';
    console.error('Error performing AI improvement:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
