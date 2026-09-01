import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import slugify from 'slugify';

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { items: true, drafts: true, sources: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ categories });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { name, description, seoTitle, seoDescription } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = slugify(name, { lower: true, strict: true });

    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ error: 'Category slug already exists' }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: {
        name,
        slug,
        description: description || `Latest ${name} news and analysis.`,
        seoTitle: seoTitle || `${name} News — THE BRIEF`,
        seoDescription: seoDescription || `Read the latest ${name} news, updates, and analysis on THE BRIEF.`,
      },
    });

    await recordActivity(
      'category_created',
      category.name,
      `Category ${category.name} created`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Failed to create category';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();
    const body = await request.json();
    const { id, name, description, seoTitle, seoDescription, enabled } = body;

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    const dataToUpdate: {
      name?: string;
      description?: string;
      seoTitle?: string;
      seoDescription?: string;
      enabled?: boolean;
    } = {};
    if (name !== undefined) dataToUpdate.name = name;
    if (description !== undefined) dataToUpdate.description = description;
    if (seoTitle !== undefined) dataToUpdate.seoTitle = seoTitle;
    if (seoDescription !== undefined) dataToUpdate.seoDescription = seoDescription;
    if (enabled !== undefined) dataToUpdate.enabled = enabled;

    const updated = await prisma.category.update({
      where: { id },
      data: dataToUpdate,
    });

    await recordActivity(
      'category_updated',
      updated.name,
      `Category ${updated.name} updated`,
      session.user || 'Admin'
    );

    return NextResponse.json({ success: true, category: updated });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Update failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
