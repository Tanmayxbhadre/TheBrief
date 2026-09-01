import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession } from '@/lib/auth';
import { aiService } from '@/lib/ai/service';

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const info = aiService.getProviderInfo();
    const isEnabled = aiService.isEnabled();

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayCount, monthCount, totalCount, totalTokensResult, recentLogs] = await Promise.all([
      prisma.aIGenerationLog.count({
        where: { createdAt: { gte: startOfToday } },
      }),
      prisma.aIGenerationLog.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.aIGenerationLog.count(),
      prisma.aIGenerationLog.aggregate({
        _sum: {
          inputTokens: true,
          outputTokens: true,
          totalTokens: true,
        },
      }),
      prisma.aIGenerationLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return NextResponse.json({
      config: {
        provider: info.provider,
        model: info.model,
        isConfigured: info.isConfigured,
        isMock: info.isMock,
        isEnabled,
      },
      stats: {
        generationsToday: todayCount,
        generationsMonth: monthCount,
        generationsTotal: totalCount,
        totalTokens: totalTokensResult._sum.totalTokens || 0,
        inputTokens: totalTokensResult._sum.inputTokens || 0,
        outputTokens: totalTokensResult._sum.outputTokens || 0,
      },
      recentLogs,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch AI stats';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
