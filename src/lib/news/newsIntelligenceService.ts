import { prisma } from '../db';
import { classifyCategory } from './classifier';
import { SOURCES } from './sourceRegistry';

export interface ExtractedEntities {
  people: string[];
  companies: string[];
  products: string[];
  locations: string[];
  technologies: string[];
}

export interface IntelligenceAnalysisResult {
  category: string;
  subcategory?: string;
  importanceScore: number;
  importanceTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
  importanceReason: string;
  breakingScore: number;
  isBreaking: boolean;
  trendingScore: number;
  entities: ExtractedEntities;
  editorialRecommendation: 'AUTO_DRAFT' | 'REVIEW' | 'LOW_PRIORITY' | 'REJECT';
  confidenceScore: number;
}

// -------------------------------------------------------------
// Subcategory Detection Rules
// -------------------------------------------------------------
const SUBCATEGORY_RULES: Record<string, Record<string, string[]>> = {
  ai: {
    'OpenAI': ['openai', 'chatgpt', 'gpt-4', 'gpt-5', 'sam altman', 'sora'],
    'Google AI': ['google ai', 'gemini', 'deepmind', 'sundar pichai', 'gemma'],
    'Anthropic': ['anthropic', 'claude', 'dario amodei'],
    'AI Models': ['llm', 'foundation model', 'weights', 'reasoning model', 'deepseek', 'llama'],
    'Generative AI': ['generative ai', 'genai', 'text-to-image', 'synthetic media', 'diffusion model'],
    'AI Regulation': ['ai act', 'safety institute', 'ai governance', 'regulation', 'copyright', 'watermark'],
    'AI Research': ['paper', 'arxiv', 'benchmark', 'hallucination', 'alignment', 'inference', 'compute'],
  },
  technology: {
    'Apple': ['apple', 'iphone', 'ipad', 'macbook', 'ios', 'tim cook', 'vision pro'],
    'Google': ['google', 'android', 'pixel', 'alphabet', 'search', 'chrome'],
    'Microsoft': ['microsoft', 'windows', 'azure', 'copilot', 'satya nadella'],
    'Meta': ['meta', 'facebook', 'instagram', 'whatsapp', 'zuckerberg', 'quest'],
    'Cybersecurity': ['malware', 'ransomware', 'hack', 'data breach', 'vulnerability', 'cve', 'zero-day'],
    'Hardware': ['chip', 'semiconductor', 'nvidia', 'intel', 'amd', 'tsmc', 'processor', 'gpu'],
    'Software': ['linux', 'open source', 'developer', 'browser', 'database', 'cloud'],
  },
  india: {
    'Economy': ['rbi', 'repo rate', 'inflation', 'gdp', 'sensex', 'nifty', 'rupee', 'fiscal'],
    'National': ['parliament', 'supreme court', 'delhi', 'modi', 'bjp', 'congress', 'policy', 'minister'],
    'Maharashtra & Mumbai': ['mumbai', 'maharashtra', 'bmc', 'maratha'],
    'Startups': ['unicorn', 'bengaluru', 'funding', 'seed round', 'zomato', 'swiggy', 'ola'],
    'Technology': ['isro', 'upi', 'semiconductor mission', 'it ministry', 'chandrayaan'],
  },
  business: {
    'Markets': ['wall street', 's&p 500', 'dow jones', 'nasdaq', 'stocks', 'bonds', 'treasury'],
    'Banking & Finance': ['federal reserve', 'central bank', 'interest rate', 'liquidity', 'goldman sachs', 'jpmorgan'],
    'Deals & M&A': ['acquisition', 'merger', 'buyout', 'antitrust', 'deal', 'stake'],
    'Earnings': ['quarterly revenue', 'q1', 'q2', 'q3', 'q4', 'profit', 'forecast', 'guidance'],
  },
  science: {
    'Space & Astronomy': ['space', 'nasa', 'isro', 'esa', 'telescope', 'james webb', 'mars', 'moon', 'orbit', 'spacex'],
    'Climate & Energy': ['climate', 'solar', 'nuclear', 'renewable', 'carbon', 'fusion', 'emissions'],
    'Biotechnology': ['crispr', 'gene', 'vaccine', 'medical', 'clinical trial', 'fda'],
  },
  world: {
    'Geopolitics': ['united nations', 'treaty', 'nato', 'sanctions', 'diplomacy', 'ambassador', 'summit'],
    'Global Conflicts': ['ceasefire', 'military', 'missile', 'defense', 'peace talks'],
    'Global Economy': ['imf', 'world bank', 'trade war', 'tariffs', 'opec', 'g20'],
  },
};

// -------------------------------------------------------------
// Known Entities Dictionary (Deterministic & Fast)
// -------------------------------------------------------------
const ENTITY_DICTIONARY = {
  companies: [
    'OpenAI', 'Microsoft', 'Google', 'Apple', 'Meta', 'NVIDIA', 'Amazon', 'Anthropic',
    'Tesla', 'DeepSeek', 'Intel', 'AMD', 'TSMC', 'SpaceX', 'Reliance', 'Tata',
    'Infosys', 'Netflix', 'ByteDance', 'Samsung', 'Sony', 'IBM', 'Salesforce',
  ],
  people: [
    'Sam Altman', 'Satya Nadella', 'Sundar Pichai', 'Elon Musk', 'Jensen Huang',
    'Tim Cook', 'Narendra Modi', 'Jerome Powell', 'Mark Zuckerberg', 'Donald Trump',
    'Joe Biden', 'Dario Amodei', 'Demis Hassabis', 'Shaktikanta Das',
  ],
  products: [
    'ChatGPT', 'GPT-4', 'GPT-5', 'Gemini', 'Claude', 'iPhone', 'MacBook', 'Windows',
    'Blackwell', 'GeForce RTX', 'Pixel', 'Android', 'iOS', 'Vision Pro', 'Starship',
    'Copilot', 'Llama', 'Sora',
  ],
  locations: [
    'United States', 'India', 'China', 'United Kingdom', 'European Union', 'New Delhi',
    'Washington', 'California', 'Bengaluru', 'Mumbai', 'Tokyo', 'London', 'Beijing',
    'Silicon Valley', 'Taiwan', 'Ukraine', 'Israel', 'Gaza',
  ],
  technologies: [
    'Artificial Intelligence', 'Machine Learning', 'Large Language Model', 'Semiconductors',
    'Quantum Computing', 'Cloud Computing', 'Generative AI', 'Cybersecurity', 'Robotics',
    'Autonomous Vehicles', 'Nuclear Fusion', 'Renewable Energy', 'Blockchain',
  ],
};

// -------------------------------------------------------------
// High-Impact Keywords for Importance Scoring
// -------------------------------------------------------------
const HIGH_IMPACT_KEYWORDS = [
  'breakthrough', 'record', 'billion', 'acquisition', 'launches', 'unveils',
  'sanctions', 'regulations', 'banned', 'crisis', 'emergency', 'summit',
  'historic', 'investigation', 'collapse', 'inflation', 'war', 'ceasefire',
  'resigns', 'antitrust', 'verdict', 'executive order',
];

const BREAKING_KEYWORDS = [
  'breaking', 'just in', 'developing story', 'emergency', 'launches today',
  'killed', 'earthquake', 'major outage', 'confirms resignation',
  'live updates', 'ceasefire announced', 'strikes target', 'flash alert',
];

/**
 * Extracts recognized entities from news title and description
 */
export function extractEntities(title: string, description = ''): ExtractedEntities {
  const combined = `${title} ${description}`;
  const lowerText = combined.toLowerCase();

  const matches = (term: string) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-zA-Z0-9])${escaped}([^a-zA-Z0-9]|$)`, 'i');
    return regex.test(lowerText);
  };

  return {
    companies: ENTITY_DICTIONARY.companies.filter(matches),
    people: ENTITY_DICTIONARY.people.filter(matches),
    products: ENTITY_DICTIONARY.products.filter(matches),
    locations: ENTITY_DICTIONARY.locations.filter(matches),
    technologies: ENTITY_DICTIONARY.technologies.filter(matches),
  };
}

/**
 * Detects specific subcategory based on matched keywords
 */
export function detectSubcategory(category: string, title: string, description = ''): string | undefined {
  const combined = `${title} ${description}`.toLowerCase();
  const rules = SUBCATEGORY_RULES[category.toLowerCase()];
  if (!rules) return undefined;

  for (const [subcat, keywords] of Object.entries(rules)) {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        return subcat;
      }
    }
  }

  return undefined;
}

/**
 * Calculates breaking score (0-100) and flag
 */
export function calculateBreakingScore(title: string, description = ''): { score: number; isBreaking: boolean } {
  const combined = `${title} ${description}`.toLowerCase();
  let score = 0;

  for (const kw of BREAKING_KEYWORDS) {
    if (combined.includes(kw)) {
      score += 35;
    }
  }

  // Title exclamation or capital alerts
  if (title.toUpperCase().startsWith('BREAKING:') || title.toUpperCase().startsWith('ALERT:')) {
    score += 45;
  }

  const finalScore = Math.min(100, Math.max(0, score));
  return {
    score: finalScore,
    isBreaking: finalScore >= 70,
  };
}

/**
 * Calculates trending score (0-100) based on source breadth, entity weight, and recency
 */
export function calculateTrendingScore(options: {
  sourceCount?: number;
  entityCount?: number;
  publishedAt?: Date | null;
  importanceScore: number;
}): number {
  const { sourceCount = 1, entityCount = 0, publishedAt, importanceScore } = options;
  let score = 0;

  // Multi-source coverage weight
  if (sourceCount >= 6) score += 40;
  else if (sourceCount >= 4) score += 30;
  else if (sourceCount >= 2) score += 20;
  else score += 10;

  // Entity density
  score += Math.min(25, entityCount * 5);

  // Freshness bonus
  if (publishedAt) {
    const ageHours = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
    if (ageHours <= 3) score += 20;
    else if (ageHours <= 12) score += 15;
    else if (ageHours <= 24) score += 10;
  } else {
    score += 10;
  }

  // Importance contribution
  score += Math.round(importanceScore * 0.15);

  return Math.min(100, Math.max(0, score));
}

/**
 * Calculates importance score (0-100) and reason for editorial clarity
 */
export function calculateImportanceScore(options: {
  title: string;
  description?: string;
  sourceReliability: number;
  sourcePriority: number;
  entities: ExtractedEntities;
  isBreaking: boolean;
  sourceCount?: number;
}): { score: number; tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW'; reason: string } {
  const { title, description = '', sourceReliability, sourcePriority, entities, isBreaking, sourceCount = 1 } = options;
  const combined = `${title} ${description}`.toLowerCase();

  let score = 40; // baseline
  const reasons: string[] = [];

  // 1. Source Reliability & Priority
  if (sourceReliability >= 95) {
    score += 15;
    reasons.push('Tier-1 verified wire source');
  } else if (sourceReliability >= 90) {
    score += 10;
  }
  if (sourcePriority === 1) {
    score += 5;
  }

  // 2. High-Impact Keyword Match
  let impactMatches = 0;
  for (const kw of HIGH_IMPACT_KEYWORDS) {
    if (combined.includes(kw)) {
      impactMatches++;
    }
  }
  if (impactMatches >= 2) {
    score += 18;
    reasons.push('High-impact public/economic significance indicators');
  } else if (impactMatches === 1) {
    score += 10;
  }

  // 3. Multi-source validation
  if (sourceCount >= 5) {
    score += 20;
    reasons.push(`Cross-verified across ${sourceCount} independent publications`);
  } else if (sourceCount >= 3) {
    score += 15;
    reasons.push(`Reported across multiple sources (${sourceCount})`);
  } else if (sourceCount === 2) {
    score += 8;
  }

  // 4. Prominent Entities
  const totalEntities =
    entities.companies.length +
    entities.people.length +
    entities.products.length +
    entities.technologies.length;

  if (totalEntities >= 3) {
    score += 12;
    reasons.push(`Key industry entities identified: ${[...entities.companies, ...entities.products].slice(0, 3).join(', ')}`);
  } else if (totalEntities >= 1) {
    score += 6;
  }

  // 5. Breaking Urgency
  if (isBreaking) {
    score += 10;
    reasons.push('Active developing or breaking event');
  }

  const finalScore = Math.min(100, Math.max(10, score));

  let tier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY LOW';
  if (finalScore >= 90) tier = 'CRITICAL';
  else if (finalScore >= 80) tier = 'HIGH';
  else if (finalScore >= 65) tier = 'MEDIUM';
  else if (finalScore >= 40) tier = 'LOW';
  else tier = 'VERY LOW';

  const reason = reasons.length > 0
    ? reasons.join('; ')
    : 'Standard category coverage with baseline editorial interest';

  return { score: finalScore, tier, reason };
}

/**
 * Computes the recommended editorial action
 */
export function determineEditorialRecommendation(
  importanceScore: number,
  sourceReliability: number,
  isDuplicate: boolean
): 'AUTO_DRAFT' | 'REVIEW' | 'LOW_PRIORITY' | 'REJECT' {
  if (isDuplicate || sourceReliability < 60) {
    return 'REJECT';
  }

  if (importanceScore >= 85 && sourceReliability >= 88) {
    return 'AUTO_DRAFT';
  }

  if (importanceScore >= 65) {
    return 'REVIEW';
  }

  return 'LOW_PRIORITY';
}

/**
 * Analyzes a NewsItem and produces comprehensive intelligence metrics
 */
export async function analyzeNewsItem(item: {
  title: string;
  description?: string | null;
  sourceId?: string;
  publishedAt?: Date | null;
  defaultCategory?: string;
  sourceCount?: number;
}): Promise<IntelligenceAnalysisResult> {
  const sourceConfig = SOURCES.find((s) => s.id === item.sourceId);
  const reliability = sourceConfig?.reliabilityScore || 85;
  const priority = sourceConfig?.priority || 1;
  const defaultCat = sourceConfig?.defaultCategory || item.defaultCategory || 'technology';

  const category = classifyCategory(item.title, defaultCat);
  const subcategory = detectSubcategory(category, item.title, item.description || '');
  const entities = extractEntities(item.title, item.description || '');
  const { score: breakingScore, isBreaking } = calculateBreakingScore(item.title, item.description || '');

  const totalEntityCount =
    entities.people.length +
    entities.companies.length +
    entities.products.length +
    entities.locations.length +
    entities.technologies.length;

  const { score: importanceScore, tier: importanceTier, reason: importanceReason } = calculateImportanceScore({
    title: item.title,
    description: item.description || '',
    sourceReliability: reliability,
    sourcePriority: priority,
    entities,
    isBreaking,
    sourceCount: item.sourceCount || 1,
  });

  const trendingScore = calculateTrendingScore({
    sourceCount: item.sourceCount || 1,
    entityCount: totalEntityCount,
    publishedAt: item.publishedAt,
    importanceScore,
  });

  const editorialRecommendation = determineEditorialRecommendation(importanceScore, reliability, false);

  // Confidence combines source reliability with entity presence and text clarity
  const confidenceScore = Math.min(
    100,
    Math.round(reliability * 0.7 + (totalEntityCount > 0 ? 20 : 10) + (item.description ? 10 : 0))
  );

  return {
    category,
    subcategory,
    importanceScore,
    importanceTier,
    importanceReason,
    breakingScore,
    isBreaking,
    trendingScore,
    entities,
    editorialRecommendation,
    confidenceScore,
  };
}

/**
 * Updates a NewsItem in the database with intelligence results
 */
export async function processNewsItemIntelligence(newsItemId: string): Promise<IntelligenceAnalysisResult | null> {
  const item = await prisma.newsItem.findUnique({
    where: { id: newsItemId },
    include: { source: true },
  });

  if (!item) return null;

  const analysis = await analyzeNewsItem({
    title: item.title,
    description: item.description,
    sourceId: item.sourceId,
    publishedAt: item.publishedAt,
  });

  await prisma.newsItem.update({
    where: { id: newsItemId },
    data: {
      subcategory: analysis.subcategory,
      importanceScore: analysis.importanceScore,
      importanceReason: analysis.importanceReason,
      breakingScore: analysis.breakingScore,
      isBreaking: item.breakingOverride === 'BREAKING' ? true : item.breakingOverride === 'NOT_BREAKING' ? false : analysis.isBreaking,
      trendingScore: analysis.trendingScore,
      entities: JSON.stringify(analysis.entities),
      editorialRecommendation: analysis.editorialRecommendation,
      confidenceScore: analysis.confidenceScore,
      intelligenceProcessed: true,
    },
  });

  return analysis;
}
