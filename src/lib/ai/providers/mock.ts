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

    const allSources = [req.primarySource, ...(req.additionalSources || [])];
    const sourceNamesList = allSources.map((s) => s.name).join(' · ');

    const draft: StructuredArticleDraft = {
      title: cleanTitle,
      suggestedSlug: slug,
      excerpt: req.description
        ? `${req.description.slice(0, 140)}...`
        : `Comprehensive editorial synthesis of developments verified across ${allSources.length} reporting sources: ${sourceNamesList}.`,
      content: isBreaking
        ? `## Breaking Development\n\n${req.description || 'Initial reports indicate significant developments underway.'}\n\n## Multi-Source Verification\n\n- Cross-verified across reporting from **${sourceNamesList}**.\n- Primary wire transmission confirmed by ${req.primarySource.name}.\n\n## Developing Questions\n\nFurther technical and official confirmations are expected in subsequent updates.`
        : `## What Happened\n\n${req.description || 'Major announcements were made today regarding key sector developments.'}\n\nAccording to comprehensive reporting synthesized across **${sourceNamesList}**, this event marks a strategic shift with broad industry implications.\n\n## Key Details & Multi-Source Reporting\n\nMultiple independent outlets confirmed core milestones, with wire briefings highlighting operational rollouts scheduled over the coming quarter.\n\n## Why It Matters\n\nThe initiative reinforces strategic positioning while delivering verified improvements for the broader ecosystem.\n\n## What's Next\n\nImplementation is slated to commence immediately, with initial phases rolling out across primary markets in the weeks ahead.`,
      quickSummary: [
        allSources.length > 1
          ? `Cross-verified across ${allSources.length} independent publications (${sourceNamesList}).`
          : `${req.primarySource.name} reported updates on ${cleanTitle}.`,
        'Strategic implications expected to impact primary stakeholders and market momentum.',
        'Follow-up rollout scheduled across subsequent implementation milestones.',
      ],
      whatYouNeedToKnow: {
        whatHappened: `Official developments announced regarding ${cleanTitle}.`,
        whyItMatters: 'Signals crucial strategic realignment and enhanced capabilities for the ecosystem.',
        keyDetails: [
          `Reporting verified across ${allSources.length} sources: ${sourceNamesList}`,
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
          title: 'Multi-Source Editorial Synthesis',
          description: `Consensus verified across ${sourceNamesList}.`,
        },
      ],
      suggestedCategory: req.categorySlug || 'technology',
      subcategory: req.subcategory,
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
