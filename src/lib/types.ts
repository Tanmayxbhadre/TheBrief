// ============================================================
// TheBrief — Type Definitions
// ============================================================

export interface Author {
  id: string;
  name: string;
  slug: string;
  bio?: string;
  avatar?: string;
  twitter?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  color?: string;
}

export interface TimelineEvent {
  date: string;
  title: string;
  description: string;
}

export interface QuickSummaryItem {
  point: string;
}

export interface WhatYouNeedToKnow {
  whatHappened: string;
  whyItMatters: string;
  keyDetails: string[];
  whatsNext: string;
}

export interface Source {
  name: string;
  url: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  author: Author;
  category: Category;
  publishedAt: string;
  updatedAt?: string;
  featuredImage: string;
  imageAlt: string;
  tags: string[];
  readingTime: number;
  sources?: Source[];
  quickSummary?: string[];
  whatYouNeedToKnow?: WhatYouNeedToKnow;
  timeline?: TimelineEvent[];
  featured?: boolean;
  breaking?: boolean;
}

export interface BreakingNewsItem {
  id: string;
  headline: string;
  url: string;
  time: string;
}

export interface SearchResult {
  articles: Article[];
  total: number;
  query: string;
}

export type ViewMode = 'grid' | 'list';
