import { auditArticleSeo, SeoAuditResult, ArticleForAudit } from './audit';

export interface OptimizedSeoFields {
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  imageAlt: string;
  tags: string[];
  auditResult: SeoAuditResult;
}

/**
 * Automated SEO Optimizer for News Articles
 * Ensures every story created or updated is fully primed to rank on Google News,
 * Bing, and social search before publication.
 */
export function optimizeArticleSeo(article: ArticleForAudit): OptimizedSeoFields {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in';
  const categorySlug = article.categorySlug || 'news';
  const rawTitle = article.title.trim();
  const slug = article.slug.trim();

  // 1. Optimize SEO Title (Target: 50-65 chars, keyword first)
  let seoTitle = (article.seoTitle || rawTitle).trim();
  if (seoTitle.length < 40) {
    // If too brief, enrich with category or brand context
    if (categorySlug && !seoTitle.toLowerCase().includes(categorySlug)) {
      seoTitle = `${seoTitle} | ${categorySlug.toUpperCase()} News`;
    }
  } else if (seoTitle.length > 68) {
    // Trim gracefully to last word under 65 chars
    const trimmed = seoTitle.slice(0, 65);
    const lastSpace = trimmed.lastIndexOf(' ');
    seoTitle = lastSpace > 35 ? trimmed.slice(0, lastSpace) : trimmed;
  }

  // 2. Optimize Meta Description (Target: 130-160 chars)
  let metaDescription = (article.metaDescription || article.excerpt || '').trim();
  if (!metaDescription && article.content) {
    metaDescription = article.content.replace(/[#*`_]/g, '').trim().slice(0, 155);
  }

  if (metaDescription.length > 160) {
    const trimmed = metaDescription.slice(0, 155);
    const lastSpace = trimmed.lastIndexOf(' ');
    metaDescription = (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
  } else if (metaDescription.length < 90 && rawTitle) {
    metaDescription = `${rawTitle}. Complete reporting and key takeaways on THE BRIEF.`;
  }

  // 3. Format Canonical URL
  const canonicalUrl = `${SITE_URL}/${categorySlug}/${slug}`;

  // 4. Optimize Image Alt Text
  let imageAlt = (article.imageAlt || '').trim();
  if (!imageAlt || imageAlt.length < 6) {
    imageAlt = `${rawTitle} - News coverage by THE BRIEF`;
  }

  // 5. Standardize Tags
  let tags: string[] = [];
  try {
    if (Array.isArray(article.tags)) {
      tags = article.tags;
    } else if (typeof article.tags === 'string') {
      tags = JSON.parse(article.tags);
    }
  } catch {
    tags = [];
  }

  if (!tags.length && rawTitle) {
    // Extract capitalized words as initial tag seeds
    const words = rawTitle.split(/\s+/).filter((w) => /^[A-Z][a-z]{2,}/.test(w));
    tags = Array.from(new Set(words.slice(0, 5)));
  }

  // Run audit against the newly optimized fields
  const auditResult = auditArticleSeo({
    ...article,
    seoTitle,
    metaDescription,
    imageAlt,
    tags,
  });

  return {
    seoTitle,
    metaDescription,
    canonicalUrl,
    imageAlt,
    tags,
    auditResult,
  };
}
