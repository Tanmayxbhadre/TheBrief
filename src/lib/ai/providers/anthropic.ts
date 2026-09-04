import { BaseAIProvider } from './base';
import {
  GenerateDraftRequest,
  GenerateDraftResponse,
  ImproveRequest,
  ImproveResponse,
  StructuredArticleDraft,
  HeadlineImprovementResult,
  SummaryImprovementResult,
  SeoImprovementResult,
  TagsImprovementResult,
  RewriteImprovementResult,
  FactCheckImprovementResult,
} from '../types';
import {
  buildArticleDraftSystemPrompt,
  buildArticleDraftUserPrompt,
} from '../prompts/articleDraftPrompt';
import { buildHeadlinePrompt } from '../prompts/headlinePrompt';
import { buildSummaryPrompt } from '../prompts/summaryPrompt';
import { buildSeoPrompt } from '../prompts/seoPrompt';
import { buildTagsPrompt } from '../prompts/tagsPrompt';
import { buildRewritePrompt } from '../prompts/rewritePrompt';
import { buildFactCheckPrompt } from '../prompts/factCheckPrompt';

export class AnthropicProvider extends BaseAIProvider {
  readonly name = 'anthropic';
  readonly defaultModel = process.env.AI_MODEL || 'claude-3-5-sonnet-20241022';
  private apiKey = process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY;

  isAvailable(): boolean {
    return !!this.apiKey && !this.apiKey.startsWith('PASTE_') && this.apiKey.trim().length > 0;
  }

  private async callMessages(
    systemPrompt: string,
    userPrompt: string,
    model = this.defaultModel
  ): Promise<{ content: string; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
    if (!this.apiKey) {
      throw new Error('Anthropic API Key is not configured on the server.');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
          max_tokens: 4000,
          temperature: 0.2,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Anthropic API returned status ${response.status}: ${errorText.slice(0, 200)}`);
      }

      const json = await response.json();
      const content = json.content?.[0]?.text;
      if (!content) {
        throw new Error('Anthropic returned an empty completion.');
      }

      const usage = json.usage
        ? {
            prompt_tokens: json.usage.input_tokens || 0,
            completion_tokens: json.usage.output_tokens || 0,
            total_tokens: (json.usage.input_tokens || 0) + (json.usage.output_tokens || 0),
          }
        : undefined;

      return { content, usage };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateDraft(req: GenerateDraftRequest): Promise<GenerateDraftResponse> {
    const startTime = Date.now();
    const systemPrompt = buildArticleDraftSystemPrompt();
    const userPrompt = buildArticleDraftUserPrompt(req);

    const { content, usage } = await this.callMessages(systemPrompt, userPrompt);
    const draft = this.parseJsonResponse<StructuredArticleDraft>(content);

    return {
      draft,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model: this.defaultModel,
    };
  }

  async improve(req: ImproveRequest): Promise<ImproveResponse> {
    const startTime = Date.now();
    let prompt = '';

    switch (req.action) {
      case 'headline':
        prompt = buildHeadlinePrompt(req.title || '', req.content);
        break;
      case 'summary':
        prompt = buildSummaryPrompt(req.title || '', req.content || '');
        break;
      case 'seo':
        prompt = buildSeoPrompt(req.title || '', req.excerpt, req.content);
        break;
      case 'tags':
        prompt = buildTagsPrompt(req.title || '', req.categorySlug, req.content);
        break;
      case 'rewrite':
        prompt = buildRewritePrompt(req.selectedText || req.content || '', req.instruction || 'clarity');
        break;
      case 'fact_check':
        prompt = buildFactCheckPrompt(req.title || '', req.content || '', req.sources);
        break;
    }

    const { content, usage } = await this.callMessages(
      'You are an authoritative editor for THE BRIEF. Return strictly JSON.',
      prompt
    );

    let result:
      | HeadlineImprovementResult
      | SummaryImprovementResult
      | SeoImprovementResult
      | TagsImprovementResult
      | RewriteImprovementResult
      | FactCheckImprovementResult;

    if (req.action === 'headline') result = this.parseJsonResponse<HeadlineImprovementResult>(content);
    else if (req.action === 'summary') result = this.parseJsonResponse<SummaryImprovementResult>(content);
    else if (req.action === 'seo') result = this.parseJsonResponse<SeoImprovementResult>(content);
    else if (req.action === 'tags') result = this.parseJsonResponse<TagsImprovementResult>(content);
    else if (req.action === 'rewrite') result = this.parseJsonResponse<RewriteImprovementResult>(content);
    else result = this.parseJsonResponse<FactCheckImprovementResult>(content);

    return {
      action: req.action,
      result,
      usage: {
        inputTokens: usage?.prompt_tokens,
        outputTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        durationMs: Date.now() - startTime,
      },
      provider: this.name,
      model: this.defaultModel,
    };
  }
}
