import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAdminSession, recordActivity } from '@/lib/auth';
import { aiService } from '@/lib/ai/service';
import { GenerateDraftRequest, SourceContext } from '@/lib/ai/types';
import slugify from 'slugify';

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session.authenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { newsItemId, mode, additionalSources, editorNotes, forceNewDraft, overwriteDraftId } = body;

    if (!newsItemId) {
      return NextResponse.json({ error: 'newsItemId is required' }, { status: 400 });
    }

    // 1. Fetch NewsItem with source and category
    const newsItem = await prisma.newsItem.findUnique({
      where: { id: newsItemId },
      include: { source: true, category: true, drafts: true },
    });

    if (!newsItem) {
      return NextResponse.json({ error: 'NewsItem not found' }, { status: 404 });
    }

    // 2. Check for existing draft if not explicitly forced or overwriting
    if (newsItem.drafts.length > 0 && !forceNewDraft && !overwriteDraftId) {
      const firstDraft = newsItem.drafts[0];
      return NextResponse.json(
        {
          draftExists: true,
          message: 'An article draft already exists for this story.',
          existingDraft: {
            id: firstDraft.id,
            title: firstDraft.title,
            slug: firstDraft.slug,
            status: firstDraft.status,
          },
        },
        { status: 200 }
      );
    }

    // 3. Prepare AI draft request
    const primarySource: SourceContext = {
      name: newsItem.source.name,
      url: newsItem.originalUrl,
      description: newsItem.description || undefined,
      isPrimary: true,
    };

    const aiReq: GenerateDraftRequest = {
      newsItemId: newsItem.id,
      headline: newsItem.title,
      description: newsItem.description || undefined,
      primarySource,
      additionalSources: Array.isArray(additionalSources) ? additionalSources : undefined,
      categorySlug: newsItem.category?.slug || 'technology',
      mode: mode === 'breaking' ? 'breaking' : 'standard',
      editorNotes: editorNotes || undefined,
    };

    // 4. Generate structured draft via AI Service
    const aiResponse = await aiService.generateArticleDraft(aiReq, session.user || 'Admin Editor');
    const { draft: aiDraft, provider, model } = aiResponse;

    // 5. Compute clean unique slug
    const baseSlug =
      slugify(aiDraft.suggestedSlug || aiDraft.title, { lower: true, strict: true, trim: true }) ||
      'thebrief-article';
    let slug = baseSlug;
    let counter = 1;
    while (
      await prisma.articleDraft.findFirst({
        where: {
          slug,
          ...(overwriteDraftId ? { NOT: { id: overwriteDraftId } } : {}),
        },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Find category ID matching suggested category
    let categoryId = newsItem.categoryId;
    if (aiDraft.suggestedCategory) {
      const cat = await prisma.category.findUnique({
        where: { slug: aiDraft.suggestedCategory.toLowerCase() },
      });
      if (cat) categoryId = cat.id;
    }

    let savedDraft;

    if (overwriteDraftId) {
      // Overwrite existing draft
      savedDraft = await prisma.articleDraft.update({
        where: { id: overwriteDraftId },
        data: {
          title: aiDraft.title,
          slug,
          excerpt: aiDraft.excerpt,
          content: aiDraft.content,
          categoryId,
          authorName: session.user || 'THE BRIEF Editorial Team',
          status: 'DRAFT',
          seoTitle: aiDraft.seoTitle,
          metaDescription: aiDraft.metaDescription,
          tags: JSON.stringify(aiDraft.tags),
          sources: JSON.stringify(aiDraft.sources),
          quickSummary: JSON.stringify(aiDraft.quickSummary),
          whatYouNeedToKnow: aiDraft.whatYouNeedToKnow ? JSON.stringify(aiDraft.whatYouNeedToKnow) : null,
          timeline: aiDraft.timeline ? JSON.stringify(aiDraft.timeline) : null,
          readingTime: aiDraft.readingTime || 3,
          aiGenerated: true,
          aiProvider: provider,
          aiModel: model,
          aiFlags: JSON.stringify(aiDraft.reviewFlags),
        },
        include: { category: true, newsItem: { include: { source: true } } },
      });
    } else {
      // Create new draft (NewsItem remains intact)
      savedDraft = await prisma.articleDraft.create({
        data: {
          newsItemId: newsItem.id,
          title: aiDraft.title,
          slug,
          excerpt: aiDraft.excerpt,
          content: aiDraft.content,
          categoryId,
          authorName: session.user || 'THE BRIEF Editorial Team',
          featuredImage: newsItem.imageUrl || '',
          imageAlt: newsItem.imageAlt || aiDraft.title,
          status: 'DRAFT',
          seoTitle: aiDraft.seoTitle,
          metaDescription: aiDraft.metaDescription,
          tags: JSON.stringify(aiDraft.tags),
          sources: JSON.stringify(aiDraft.sources),
          quickSummary: JSON.stringify(aiDraft.quickSummary),
          whatYouNeedToKnow: aiDraft.whatYouNeedToKnow ? JSON.stringify(aiDraft.whatYouNeedToKnow) : null,
          timeline: aiDraft.timeline ? JSON.stringify(aiDraft.timeline) : null,
          readingTime: aiDraft.readingTime || 3,
          aiGenerated: true,
          aiProvider: provider,
          aiModel: model,
          aiFlags: JSON.stringify(aiDraft.reviewFlags),
        },
        include: { category: true, newsItem: { include: { source: true } } },
      });
    }

    // Update newsItem status to REVIEW if it was DISCOVERED
    if (newsItem.status === 'DISCOVERED') {
      await prisma.newsItem.update({
        where: { id: newsItem.id },
        data: { status: 'REVIEW' },
      });
    }

    await recordActivity(
      'ai_draft_generated',
      savedDraft.title,
      `Generated AI draft with ${provider} (${model})`,
      session.user || 'Admin'
    );

    return NextResponse.json({
      success: true,
      draft: savedDraft,
      usage: aiResponse.usage,
      provider,
      model,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Draft generation failed';
    console.error('Error generating AI draft:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
