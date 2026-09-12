/**
 * Algorithmic SEO Audit Engine for TheBrief Newsroom
 * Evaluates all major ranking factors required for Google News, Google Discover,
 * Top Stories Carousels, and search result snippet dominance.
 */

export interface SeoAuditCheck {
  id: string;
  name: string;
  status: 'passed' | 'warning' | 'critical';
  score: number; // contribution to total (0-100)
  maxScore: number;
  message: string;
  recommendation?: string;
}

export interface SeoAuditResult {
  score: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Work';
  isRankReady: boolean;
  passedCount: number;
  warningCount: number;
  criticalCount: number;
  checks: SeoAuditCheck[];
  timestamp: string;
}

export interface ArticleForAudit {
  title: string;
  slug: string;
  excerpt?: string | null;
  content?: string | null;
  seoTitle?: string | null;
  metaDescription?: string | null;
  categorySlug?: string | null;
  authorName?: string | null;
  featuredImage?: string | null;
  imageAlt?: string | null;
  sources?: string | Array<{ name: string; url: string }> | null;
  quickSummary?: string | string[] | null;
  whatYouNeedToKnow?: string | object | null;
  tags?: string | string[] | null;
  wordCount?: number;
}

export function auditArticleSeo(article: ArticleForAudit): SeoAuditResult {
  const checks: SeoAuditCheck[] = [];

  const effectiveTitle = (article.seoTitle || article.title || '').trim();
  const effectiveDescription = (article.metaDescription || article.excerpt || '').trim();
  const slug = (article.slug || '').trim();
  const content = (article.content || '').trim();
  const wordCount = article.wordCount || content.split(/\s+/).filter(Boolean).length;

  // 1. Title Tag Audit (Max 15 pts)
  if (!effectiveTitle) {
    checks.push({
      id: 'title_present',
      name: 'Title Tag Presence',
      status: 'critical',
      score: 0,
      maxScore: 15,
      message: 'Article title or SEO title is missing.',
      recommendation: 'Provide a compelling, keyword-rich headline between 45 and 65 characters.',
    });
  } else if (effectiveTitle.length >= 40 && effectiveTitle.length <= 70) {
    checks.push({
      id: 'title_length',
      name: 'Title Tag Length',
      status: 'passed',
      score: 15,
      maxScore: 15,
      message: `Optimal title length (${effectiveTitle.length} characters) for Google search snippets.`,
    });
  } else if (effectiveTitle.length < 40) {
    checks.push({
      id: 'title_length',
      name: 'Title Tag Length',
      status: 'warning',
      score: 9,
      maxScore: 15,
      message: `Title is somewhat short (${effectiveTitle.length} characters). May lack search volume keywords.`,
      recommendation: 'Expand title with context or key names (target 45–65 characters).',
    });
  } else {
    checks.push({
      id: 'title_length',
      name: 'Title Tag Length',
      status: 'warning',
      score: 9,
      maxScore: 15,
      message: `Title exceeds 70 characters (${effectiveTitle.length}). Will be truncated in search results.`,
      recommendation: 'Keep primary keyword in the first 50 characters to prevent ellipsis truncation.',
    });
  }

  // 2. Meta Description Audit (Max 15 pts)
  if (!effectiveDescription) {
    checks.push({
      id: 'meta_desc_present',
      name: 'Meta Description Presence',
      status: 'critical',
      score: 0,
      maxScore: 15,
      message: 'Meta description is missing.',
      recommendation: 'Write an informative 130–160 character description summarizing the event.',
    });
  } else if (effectiveDescription.length >= 110 && effectiveDescription.length <= 165) {
    checks.push({
      id: 'meta_desc_length',
      name: 'Meta Description Length',
      status: 'passed',
      score: 15,
      maxScore: 15,
      message: `Optimal meta description length (${effectiveDescription.length} characters).`,
    });
  } else if (effectiveDescription.length < 110) {
    checks.push({
      id: 'meta_desc_length',
      name: 'Meta Description Length',
      status: 'warning',
      score: 8,
      maxScore: 15,
      message: `Meta description is short (${effectiveDescription.length} chars). Search engines may choose arbitrary text instead.`,
      recommendation: 'Expand description to 130–160 characters with key facts.',
    });
  } else {
    checks.push({
      id: 'meta_desc_length',
      name: 'Meta Description Length',
      status: 'warning',
      score: 10,
      maxScore: 15,
      message: `Meta description is long (${effectiveDescription.length} chars) and will truncate.`,
      recommendation: 'Trim to under 160 characters for crisp display in SERP.',
    });
  }

  // 3. Clean URL Slug Audit (Max 10 pts)
  const isKebabCase = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (!slug) {
    checks.push({
      id: 'slug_present',
      name: 'URL Slug Structure',
      status: 'critical',
      score: 0,
      maxScore: 10,
      message: 'URL slug is missing.',
      recommendation: 'Generate a lowercase, hyphen-separated slug.',
    });
  } else if (isKebabCase && slug.length <= 80) {
    checks.push({
      id: 'slug_clean',
      name: 'URL Slug Structure',
      status: 'passed',
      score: 10,
      maxScore: 10,
      message: `Clean, search-engine friendly slug: "/${slug}".`,
    });
  } else {
    checks.push({
      id: 'slug_clean',
      name: 'URL Slug Structure',
      status: 'warning',
      score: 5,
      maxScore: 10,
      message: 'Slug contains non-standard characters or is excessively long.',
      recommendation: 'Use only lowercase alphanumeric characters and single hyphens.',
    });
  }

  // 4. Content Depth & Readability (Max 20 pts)
  if (wordCount >= 300) {
    checks.push({
      id: 'content_depth',
      name: 'Editorial Content Depth',
      status: 'passed',
      score: 20,
      maxScore: 20,
      message: `Substantive article depth (${wordCount} words). Well above thin content penalty threshold.`,
    });
  } else if (wordCount >= 180) {
    checks.push({
      id: 'content_depth',
      name: 'Editorial Content Depth',
      status: 'warning',
      score: 12,
      maxScore: 20,
      message: `Moderate length (${wordCount} words). Meets breaking brief threshold, but in-depth reporting ranks higher.`,
      recommendation: 'Add further context or what-it-means analysis to reach 300+ words.',
    });
  } else {
    checks.push({
      id: 'content_depth',
      name: 'Editorial Content Depth',
      status: 'critical',
      score: 4,
      maxScore: 20,
      message: `Content is too short (${wordCount} words). High risk of Google thin content filtering.`,
      recommendation: 'Expand reporting body with background and corroborated facts.',
    });
  }

  // 5. Source Transparency & EEAT (Max 15 pts)
  let parsedSources: Array<{ name: string; url: string }> = [];
  try {
    if (typeof article.sources === 'string') {
      parsedSources = JSON.parse(article.sources);
    } else if (Array.isArray(article.sources)) {
      parsedSources = article.sources;
    }
  } catch {}

  if (parsedSources.length >= 1 && parsedSources.some((s) => s.url && s.name)) {
    checks.push({
      id: 'source_attribution',
      name: 'Source Attribution (EEAT)',
      status: 'passed',
      score: 15,
      maxScore: 15,
      message: `Attributed to ${parsedSources.length} verified news source(s). Complies with Google EEAT guidelines.`,
    });
  } else {
    checks.push({
      id: 'source_attribution',
      name: 'Source Attribution (EEAT)',
      status: 'critical',
      score: 0,
      maxScore: 15,
      message: 'No original wire or source attribution link found.',
      recommendation: 'Provide source attribution (e.g. Reuters, Bloomberg, PIB) with valid URL.',
    });
  }

  // 6. Featured Image & Alt Text (Max 15 pts)
  const hasImage = !!article.featuredImage;
  const hasAlt = !!article.imageAlt && article.imageAlt.trim().length >= 8;

  if (hasImage && hasAlt) {
    checks.push({
      id: 'image_seo',
      name: 'Image SEO & Discover Readiness',
      status: 'passed',
      score: 15,
      maxScore: 15,
      message: 'Featured image present with descriptive alt text for Google Discover and Images.',
    });
  } else if (hasImage && !hasAlt) {
    checks.push({
      id: 'image_seo',
      name: 'Image SEO & Discover Readiness',
      status: 'warning',
      score: 8,
      maxScore: 15,
      message: 'Featured image present, but alt text is missing or generic.',
      recommendation: 'Add descriptive alt text mentioning the subject of the photo.',
    });
  } else {
    checks.push({
      id: 'image_seo',
      name: 'Image SEO & Discover Readiness',
      status: 'warning',
      score: 0,
      maxScore: 15,
      message: 'Featured image missing. Articles without 1200px+ images are ineligible for Google Top Stories.',
      recommendation: 'Attach a high-resolution 16:9 featured image.',
    });
  }

  // 7. Structured Journalistic Modules (Quick Summary & What You Need To Know) (Max 10 pts)
  const hasSummary = !!article.quickSummary;
  const hasWhatYouNeed = !!article.whatYouNeedToKnow;

  if (hasSummary && hasWhatYouNeed) {
    checks.push({
      id: 'structured_modules',
      name: 'Structured News Modules',
      status: 'passed',
      score: 10,
      maxScore: 10,
      message: 'Includes Quick Summary bullet points and "What You Need To Know" breakdown.',
    });
  } else if (hasSummary || hasWhatYouNeed) {
    checks.push({
      id: 'structured_modules',
      name: 'Structured News Modules',
      status: 'passed',
      score: 6,
      maxScore: 10,
      message: 'Includes basic structured journalistic module.',
    });
  } else {
    checks.push({
      id: 'structured_modules',
      name: 'Structured News Modules',
      status: 'warning',
      score: 2,
      maxScore: 10,
      message: 'Structured summaries enhance user dwell time and featured snippet ranking.',
      recommendation: 'Generate Quick Summary key takeaways.',
    });
  }

  // Calculate composite score
  const totalEarned = checks.reduce((acc, c) => acc + c.score, 0);
  const totalMax = checks.reduce((acc, c) => acc + c.maxScore, 0);
  const normalizedScore = Math.min(100, Math.round((totalEarned / totalMax) * 100));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'Needs Work' = 'Needs Work';
  if (normalizedScore >= 92) grade = 'A+';
  else if (normalizedScore >= 82) grade = 'A';
  else if (normalizedScore >= 70) grade = 'B';
  else if (normalizedScore >= 55) grade = 'C';

  const passedCount = checks.filter((c) => c.status === 'passed').length;
  const warningCount = checks.filter((c) => c.status === 'warning').length;
  const criticalCount = checks.filter((c) => c.status === 'critical').length;

  return {
    score: normalizedScore,
    grade,
    isRankReady: criticalCount === 0 && normalizedScore >= 70,
    passedCount,
    warningCount,
    criticalCount,
    checks,
    timestamp: new Date().toISOString(),
  };
}
