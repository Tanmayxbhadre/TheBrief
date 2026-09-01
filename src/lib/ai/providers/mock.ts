import { BaseAIProvider } from './base';
import {
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
  StructuredArticleDraft,
} from '../types';
import slugify from 'slugify';

export class MockAIProvider extends BaseAIProvider {
  readonly name = 'mock';
  readonly defaultModel = 'thebrief-editorial-mock-v1';

  isAvailable(): boolean {
    return true;
  }

  async generateDraft(req: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const startTime = Date.now();

    // Simulate short server latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    const cleanTitle = req.headline.trim();
    const slug = slugify(cleanTitle, { lower: true, strict: true, trim: true }) || 'editorial-draft';
    const isBreaking = req.mode === 'breaking';

    const draft: StructuredArticleDraft = {
      title: cleanTitle,
      suggestedSlug: slug,
      excerpt: req.description
        ? `${req.description.slice(0, 140)}...`
        : `Comprehensive editorial synthesis of the latest developments reported by ${req.primarySource.name}.`,
      content: isBreaking
        ? `## Breaking Development\n\n${req.description || 'Initial reports indicate significant developments underway.'}\n\n## What is Confirmed\n\n- Primary reporting originated from ${req.primarySource.name}.\n- Key stakeholders have been notified as details continue to unfold.\n\n## Developing Questions\n\nFurther technical and official confirmations are expected in subsequent updates.`
        : `## What Happened\n\n${req.description || 'Major announcements were made today regarding key sector developments.'}\n\nAccording to reporting from **${req.primarySource.name}**, this move marks a strategic shift with wide-ranging implications.\n\n## Key Details & Context\n\nIndustry analysts note that this development addresses longstanding market demands. Further briefings highlighted operational milestones set to take effect over the coming quarter.\n\n## Why It Matters\n\nThe initiative reinforces strategic positioning while delivering tangible improvements for end users and ecosystem partners alike.\n\n## What's Next\n\nImplementation is slated to commence immediately, with initial phases rolling out across primary markets in the weeks ahead.`,
      quickSummary: [
        `${req.primarySource.name} reported significant updates on ${cleanTitle}.`,
        'Strategic implications expected to impact primary stakeholders and market momentum.',
        'Follow-up rollout scheduled across subsequent implementation milestones.',
      ],
      whatYouNeedToKnow: {
        whatHappened: `Official developments announced regarding ${cleanTitle}.`,
        whyItMatters: 'Signals crucial strategic realignment and enhanced capabilities for the ecosystem.',
        keyDetails: [
          `Original reporting by ${req.primarySource.name}`,
          'Initial rollout scheduled for immediate phased deployment',
          'Cross-functional teams leading implementation guidelines',
        ],
        whatsNext: 'Further operational guidance and expanded availability expected in coming weeks.',
      },
      timeline: [
        {
          date: 'Initial Discovery',
          title: 'Wire Alert Dispatched',
          description: `Discovered and verified via ${req.primarySource.name}.`,
        },
        {
          date: 'Current Phase',
          title: 'Editorial Synthesis',
          description: 'Fact-checking and draft preparation completed.',
        },
      ],
      suggestedCategory: req.categorySlug || 'technology',
      tags: [req.categorySlug || 'Technology', req.primarySource.name, 'Editorial', 'Analysis'],
      seoTitle: `${cleanTitle.slice(0, 45)} — THE BRIEF`,
      metaDescription: `Read THE BRIEF's comprehensive analysis on ${cleanTitle.toLowerCase()}. Facts, timeline, and industry implications explained.`.slice(
        0,
        155
      ),
      alternativeHeadlines: [
        `Explained: ${cleanTitle}`,
        `Inside ${cleanTitle}: Key Facts & Implications`,
        `What ${cleanTitle} Means for the Industry`,
      ],
      sources: [
        { name: req.primarySource.name, url: req.primarySource.url },
        ...(req.additionalSources || []).map((s) => ({ name: s.name, url: s.url })),
      ],
      reviewFlags: {
        needsVerification: true,
        verificationNotes: [
          `Confirm rollout schedule with primary source (${req.primarySource.name}).`,
          'Verify specific numeric metrics against official release.',
        ],
      },
      readingTime: isBreaking ? 2 : 4,
    };

    return {
      draft,
      usage: {
        inputTokens: 450,
        outputTokens: 680,
        totalTokens: 1130,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model: this.defaultModel,
    };
  }

  async improve(req: ImproveRequest): Promise<ImproveResponse> {
    const startTime = Date.now();
    await new Promise((resolve) => setTimeout(resolve, 300));

    switch (req.action) {
      case 'headline': {
        const title = req.title || 'Breaking Story';
        return {
          action: 'headline',
          result: {
            headline: `${title}: Full Analysis & Key Facts`,
            alternatives: [
              `Explained: Why ${title} Matters Now`,
              `Behind ${title}: What You Need To Know`,
              `${title} — Critical Takeaways for Readers`,
            ],
          },
          usage: { inputTokens: 120, outputTokens: 80, totalTokens: 200, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'summary': {
        return {
          action: 'summary',
          result: {
            quickSummary: [
              `Major developments confirmed regarding ${req.title || 'the story'}.`,
              'Strategic impacts across key sectors and stakeholders highlighted.',
              'Ongoing implementation timeline confirmed by primary reporting.',
            ],
          },
          usage: { inputTokens: 200, outputTokens: 90, totalTokens: 290, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'seo': {
        const base = (req.title || 'The Brief Editorial').slice(0, 45);
        return {
          action: 'seo',
          result: {
            seoTitle: `${base} — THE BRIEF`,
            metaDescription: `Discover key facts, analysis, and implications regarding ${base.toLowerCase()}. Serious journalism by THE BRIEF.`.slice(
              0,
              155
            ),
          },
          usage: { inputTokens: 150, outputTokens: 60, totalTokens: 210, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'tags': {
        const topic = req.categorySlug ? [req.categorySlug] : ['Technology'];
        return {
          action: 'tags',
          result: {
            tags: [...topic, 'Editorial', 'Analysis', 'Industry', 'Policy'],
          },
          usage: { inputTokens: 100, outputTokens: 40, totalTokens: 140, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'rewrite': {
        const text = req.selectedText || req.content || '';
        const tone = req.instruction || 'clarity';
        let rewritten = text;
        if (tone === 'concise') {
          rewritten = text.split('. ').slice(0, 2).join('. ');
        } else if (tone === 'informative') {
          rewritten = `${text} According to verified reporting, these developments establish key benchmarks for the field.`;
        } else {
          rewritten = text.trim();
        }
        return {
          action: 'rewrite',
          result: {
            rewrittenText: rewritten,
            tone,
          },
          usage: { inputTokens: 180, outputTokens: 120, totalTokens: 300, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }

      case 'fact_check': {
        return {
          action: 'fact_check',
          result: {
            claims: [
              {
                claim: 'Primary news event occurred as announced.',
                status: 'verified',
                note: 'Consistent with source reporting.',
                sourceAttribution: req.sources?.[0]?.name || 'Primary Wire',
              },
              {
                claim: 'Timeline and milestone schedules.',
                status: 'unconfirmed',
                note: 'Target dates require corroboration with official calendar.',
              },
            ],
            overallAssessment: 'Factual core supported by wire reporting; specific dates require editorial review.',
            reviewFlags: {
              needsVerification: true,
              verificationNotes: ['Verify secondary dates and figures before final publication.'],
            },
          },
          usage: { inputTokens: 350, outputTokens: 160, totalTokens: 510, durationMs: Date.now() - startTime },
          provider: this.name,
          model: this.defaultModel,
        };
      }
    }
  }
}
