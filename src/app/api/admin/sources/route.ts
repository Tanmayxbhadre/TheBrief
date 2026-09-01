import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { SOURCES } from '@/lib/news/sourceRegistry';

export async function GET() {
  try {
    // Ensure all registered sources exist in DB
    for (const src of SOURCES) {
      const existing = await prisma.source.findUnique({ where: { id: src.id } });
      if (!existing) {
        await prisma.source.create({
          data: {
            id: src.id,
            name: src.name,
            type: src.type,
            url: src.url,
            country: src.country,
            language: src.language,
            priority: src.priority,
            enabled: src.enabled,
          },
        });
      }
    }

    const sources = await prisma.source.findMany({
      include: {
        category: true,
        _count: {
          select: { items: true },
        },
        logs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { priority: 'asc' },
    });

    const sourcesWithHealth = sources.map((s) => {
      let healthStatus: 'healthy' | 'warning' | 'error' | 'disabled' = 'healthy';
      if (!s.enabled) {
        healthStatus = 'disabled';
      } else if (s.lastError) {
        healthStatus = 'error';
      } else if (!s.lastFetch) {
        healthStatus = 'warning';
      }

      return {
        ...s,
        healthStatus,
        itemCount: s._count.items,
        lastLog: s.logs[0] || null,
      };
    });

    return NextResponse.json({ sources: sourcesWithHealth });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to fetch sources';
    console.error('Error fetching sources:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { id, enabled, priority, url } = body;

    if (!id) {
      return NextResponse.json({ error: 'Source ID is required' }, { status: 400 });
    }

    const dataToUpdate: {
      enabled?: boolean;
      priority?: number;
      url?: string;
    } = {};
    if (enabled !== undefined) dataToUpdate.enabled = enabled;
    if (priority !== undefined) dataToUpdate.priority = priority;
    if (url !== undefined) dataToUpdate.url = url;

    const updated = await prisma.source.update({
      where: { id },
      data: dataToUpdate,
    });

    await recordActivity(
      'source_updated',
      updated.name,
      `Source ${updated.name} ${enabled !== undefined ? (enabled ? 'enabled' : 'disabled') : 'updated'}`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, source: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
