import {
  AIProvider,
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
  StructuredArticleDraft,
} from './types';
import {
  StructuredArticleDraftSchema,
  HeadlineImprovementSchema,
  SummaryImprovementSchema,
  SeoImprovementSchema,
  TagsImprovementSchema,
  RewriteImprovementSchema,
  FactCheckImprovementSchema,
} from './schemas';
import { MockAIProvider } from './providers/mock';
import { OpenAIProvider } from './providers/openai';
import { GeminiProvider } from './providers/gemini';
import { AnthropicProvider } from './providers/anthropic';
import { prisma } from '../db';

class AIService {
  private activeProvider: AIProvider;

  constructor() {
    const providerName = (process.env.AI_PROVIDER || 'mock').toLowerCase();

    if (providerName === 'openai') {
      const p = new OpenAIProvider();
      this.activeProvider = p.isAvailable() ? p : new MockAIProvider();
    } else if (providerName === 'gemini') {
      const p = new GeminiProvider();
      this.activeProvider = p.isAvailable() ? p : new MockAIProvider();
    } else if (providerName === 'anthropic') {
      const p = new AnthropicProvider();
      this.activeProvider = p.isAvailable() ? p : new MockAIProvider();
    } else {
      this.activeProvider = new MockAIProvider();
    }
  }

  public getProviderInfo(): { provider: string; model: string; isConfigured: boolean; isMock: boolean } {
    const isMock = this.activeProvider.name === 'mock';
    return {
      provider: this.activeProvider.name,
      model: this.activeProvider.defaultModel,
      isConfigured: this.activeProvider.isAvailable(),
      isMock,
    };
  }

  public isEnabled(): boolean {
    return process.env.AI_ENABLED !== 'false';
  }

  /**
   * Generates a structured article draft and validates it against Zod schema
   */
  async generateArticleDraft(
    req: GenerateDraftRequest,
    user = 'Admin Editor'
  ): Promise<GenerateDraftResponse> {
    if (!this.isEnabled()) {
      throw new Error('AI drafting service is currently disabled in system settings.');
    }

    const startTime = Date.now();
    let response: GenerateDraftResponse | null = null;
    let errorMsg: string | null = null;

    try {
      response = await this.activeProvider.generateDraft(req);

      // Validate schema strictly
      const validation = StructuredArticleDraftSchema.safeParse(response.draft);
      if (!validation.success) {
        throw new Error(
          `AI returned data with invalid schema: ${validation.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`
        );
      }

      response.draft = validation.data as StructuredArticleDraft;

      // Sanitize markdown and fields
      response.draft.title = response.draft.title.trim();
      response.draft.excerpt = response.draft.excerpt.trim();

      // Log success
      await this.logGeneration({
        operation: 'draft_generation',
        provider: response.provider,
        model: response.model,
        newsItemId: req.newsItemId,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
        durationMs: response.usage.durationMs || Date.now() - startTime,
        status: 'SUCCESS',
        reviewFlags: JSON.stringify(response.draft.reviewFlags),
        user,
      });

      return response;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Unknown AI generation error';

      await this.logGeneration({
        operation: 'draft_generation',
        provider: this.activeProvider.name,
        model: this.activeProvider.defaultModel,
        newsItemId: req.newsItemId,
        durationMs: Date.now() - startTime,
        status: 'FAILED',
        errorMessage: errorMsg,
        user,
      });

      throw new Error(`AI Draft Generation Failed: ${errorMsg}`);
    }
  }

  /**
   * Performs granular editorial improvements
   */
  async improve(req: ImproveRequest, user = 'Admin Editor'): Promise<ImproveResponse> {
    if (!this.isEnabled()) {
      throw new Error('AI drafting service is currently disabled in system settings.');
    }

    const startTime = Date.now();
    let response: ImproveResponse | null = null;
    let errorMsg: string | null = null;

    try {
      response = await this.activeProvider.improve(req);

      // Validate corresponding schema
      if (req.action === 'headline') {
        const v = HeadlineImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid headline structure from AI');
        response.result = v.data;
      } else if (req.action === 'summary') {
        const v = SummaryImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid summary structure from AI');
        response.result = v.data;
      } else if (req.action === 'seo') {
        const v = SeoImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid SEO structure from AI');
        response.result = v.data;
      } else if (req.action === 'tags') {
        const v = TagsImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid tags structure from AI');
        response.result = v.data;
      } else if (req.action === 'rewrite') {
        const v = RewriteImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid rewrite structure from AI');
        response.result = v.data;
      } else if (req.action === 'fact_check') {
        const v = FactCheckImprovementSchema.safeParse(response.result);
        if (!v.success) throw new Error('Invalid fact check structure from AI');
        response.result = v.data;
      }

      await this.logGeneration({
        operation: req.action,
        provider: response.provider,
        model: response.model,
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
        durationMs: response.usage.durationMs || Date.now() - startTime,
        status: 'SUCCESS',
        user,
      });

      return response;
    } catch (err) {
      errorMsg = err instanceof Error ? err.message : 'Unknown AI improvement error';

      await this.logGeneration({
        operation: req.action,
        provider: this.activeProvider.name,
        model: this.activeProvider.defaultModel,
        durationMs: Date.now() - startTime,
        status: 'FAILED',
        errorMessage: errorMsg,
        user,
      });

      throw new Error(`AI ${req.action} Failed: ${errorMsg}`);
    }
  }

  private async logGeneration(data: {
    operation: string;
    provider: string;
    model: string;
    newsItemId?: string;
    draftId?: string;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    durationMs: number;
    status: string;
    errorMessage?: string;
    reviewFlags?: string;
    user: string;
  }) {
    try {
      await prisma.aIGenerationLog.create({
        data: {
          operation: data.operation,
          provider: data.provider,
          model: data.model,
          newsItemId: data.newsItemId,
          draftId: data.draftId,
          inputTokens: data.inputTokens,
          outputTokens: data.outputTokens,
          totalTokens: data.totalTokens,
          durationMs: data.durationMs,
          status: data.status,
          errorMessage: data.errorMessage,
          reviewFlags: data.reviewFlags,
          user: data.user,
        },
      });
    } catch (logErr) {
      console.warn('Failed to record AI generation log:', logErr);
    }
  }
}

export const aiService = new AIService();
