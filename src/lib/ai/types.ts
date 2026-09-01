export type AIProviderType = 'mock' | 'openai' | 'gemini' | 'anthropic';

export type DraftMode = 'standard' | 'breaking';

export type RewriteTone = 'clarity' | 'concise' | 'informative' | 'grammar';

export interface SourceContext {
  name: string;
  url: string;
  description?: string;
  isPrimary?: boolean;
}

export interface GenerateDraftRequest {
  newsItemId?: string;
  headline: string;
  description?: string;
  primarySource: SourceContext;
  additionalSources?: SourceContext[];
  categorySlug?: string;
  mode?: DraftMode;
  editorNotes?: string;
}

export interface ReviewFlags {
  needsVerification: boolean;
  verificationNotes: string[];
}

export interface WhatYouNeedToKnowStructure {
  whatHappened?: string;
  whyItMatters?: string;
  keyDetails?: string[];
  whatsNext?: string;
}

export interface TimelineEntry {
  date: string;
  title: string;
  description: string;
}

export interface StructuredArticleDraft {
  title: string;
  suggestedSlug: string;
  excerpt: string;
  content: string;
  quickSummary: string[];
  whatYouNeedToKnow?: WhatYouNeedToKnowStructure;
  timeline?: TimelineEntry[];
  suggestedCategory: string;
  tags: string[];
  seoTitle: string;
  metaDescription: string;
  alternativeHeadlines?: string[];
  sources: Array<{ name: string; url: string }>;
  reviewFlags: ReviewFlags;
  readingTime: number;
}

export interface AIUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  durationMs: number;
}

export interface GenerateDraftResponse {
  draft: StructuredArticleDraft;
  usage: AIUsage;
  provider: string;
  model: string;
}

export type ImproveAction =
  | 'headline'
  | 'summary'
  | 'seo'
  | 'tags'
  | 'rewrite'
  | 'fact_check';

export interface ImproveRequest {
  action: ImproveAction;
  title?: string;
  excerpt?: string;
  content?: string;
  sources?: Array<{ name: string; url: string }>;
  selectedText?: string;
  instruction?: RewriteTone;
  categorySlug?: string;
  tags?: string[];
}

export interface HeadlineImprovementResult {
  headline: string;
  alternatives: string[];
}

export interface SummaryImprovementResult {
  quickSummary: string[];
}

export interface SeoImprovementResult {
  seoTitle: string;
  metaDescription: string;
}

export interface TagsImprovementResult {
  tags: string[];
}

export interface RewriteImprovementResult {
  rewrittenText: string;
  tone: RewriteTone;
}

export interface FactCheckClaim {
  claim: string;
  status: 'verified' | 'unconfirmed' | 'conflicting';
  note: string;
  sourceAttribution?: string;
}

export interface FactCheckImprovementResult {
  claims: FactCheckClaim[];
  overallAssessment: string;
  reviewFlags: ReviewFlags;
}

export interface ImproveResponse {
  action: ImproveAction;
  result:
    | HeadlineImprovementResult
    | SummaryImprovementResult
    | SeoImprovementResult
    | TagsImprovementResult
    | RewriteImprovementResult
    | FactCheckImprovementResult;
  usage: AIUsage;
  provider: string;
  model: string;
}

export interface AIProvider {
  readonly name: string;
  readonly defaultModel: string;
  isAvailable(): boolean;
  generateDraft(request: GenerateDraftRequest): Promise<GenerateDraftResponse>;
  improve(request: ImproveRequest): Promise<ImproveResponse>;
}
