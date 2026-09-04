import { z } from 'zod';

export const ReviewFlagsSchema = z.object({
  needsVerification: z.boolean().default(false),
  verificationNotes: z.array(z.string()).default([]),
});

export const WhatYouNeedToKnowSchema = z
  .object({
    whatHappened: z.string().optional(),
    whyItMatters: z.string().optional(),
    keyDetails: z.array(z.string()).optional(),
    whatsNext: z.string().optional(),
  })
  .optional();

export const TimelineEntrySchema = z.object({
  date: z.string(),
  title: z.string(),
  description: z.string(),
});

export const SourceAttributionSchema = z.object({
  name: z.string(),
  url: z.string(),
});

export const StructuredArticleDraftSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  suggestedSlug: z.string().min(3, 'Slug must be at least 3 characters'),
  excerpt: z.string().min(10, 'Excerpt must be at least 10 characters'),
  content: z.string().min(50, 'Content must be at least 50 characters'),
  quickSummary: z.array(z.string()).min(1, 'At least 1 summary bullet required'),
  whatYouNeedToKnow: WhatYouNeedToKnowSchema,
  timeline: z.array(TimelineEntrySchema).optional(),
  suggestedCategory: z.string().default('technology'),
  subcategory: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least 1 tag required').max(10),
  seoTitle: z.string().min(10, 'SEO title must be at least 10 characters'),
  metaDescription: z.string().min(30, 'Meta description must be at least 30 characters'),
  alternativeHeadlines: z.array(z.string()).optional(),
  sources: z.array(SourceAttributionSchema).min(1, 'At least 1 source attribution required'),
  reviewFlags: ReviewFlagsSchema.default({ needsVerification: false, verificationNotes: [] }),
  readingTime: z.number().int().min(1).default(3),
});

export const HeadlineImprovementSchema = z.object({
  headline: z.string().min(5),
  alternatives: z.array(z.string()).default([]),
});

export const SummaryImprovementSchema = z.object({
  quickSummary: z.array(z.string()).min(1),
});

export const SeoImprovementSchema = z.object({
  seoTitle: z.string().min(10),
  metaDescription: z.string().min(30),
});

export const TagsImprovementSchema = z.object({
  tags: z.array(z.string()).min(1).max(10),
});

export const RewriteImprovementSchema = z.object({
  rewrittenText: z.string().min(1),
  tone: z.enum(['clarity', 'concise', 'informative', 'grammar']),
});

export const FactCheckClaimSchema = z.object({
  claim: z.string(),
  status: z.enum(['verified', 'unconfirmed', 'conflicting']),
  note: z.string(),
  sourceAttribution: z.string().optional(),
});

export const FactCheckImprovementSchema = z.object({
  claims: z.array(FactCheckClaimSchema).default([]),
  overallAssessment: z.string().default('Editorial verification required.'),
  reviewFlags: ReviewFlagsSchema.default({ needsVerification: false, verificationNotes: [] }),
});
