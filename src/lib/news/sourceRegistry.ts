export interface NewsSourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api';
  url: string;
  defaultCategory: string; // fallback if classifier doesn't match
  language: string;
  country: string;
  region?: string;
  enabled: boolean;
  priority: number;
  reliabilityScore: number; // 0-100 reliability rating
  categoryCoverage?: string[];
}

export const SOURCES: NewsSourceConfig[] = [
  // Tech & AI
  {
    id: 'techcrunch',
    name: 'TechCrunch',
    type: 'rss',
    url: 'https://techcrunch.com/feed/',
    defaultCategory: 'technology',
    language: 'en',
    country: 'US',
    region: 'North America',
    enabled: true,
    priority: 1,
    reliabilityScore: 90,
    categoryCoverage: ['technology', 'ai', 'startups', 'business'],
  },
  {
    id: 'theverge',
    name: 'The Verge',
    type: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
    defaultCategory: 'technology',
    language: 'en',
    country: 'US',
    region: 'North America',
    enabled: true,
    priority: 1,
    reliabilityScore: 92,
    categoryCoverage: ['technology', 'ai', 'science', 'gadgets'],
  },
  {
    id: 'wired',
    name: 'Wired',
    type: 'rss',
    url: 'https://www.wired.com/feed/rss',
    defaultCategory: 'technology',
    language: 'en',
    country: 'US',
    region: 'North America',
    enabled: true,
    priority: 1,
    reliabilityScore: 93,
    categoryCoverage: ['technology', 'ai', 'science', 'security'],
  },
  
  // Business
  {
    id: 'cnbc-business',
    name: 'CNBC Business',
    type: 'rss',
    url: 'https://search.cnbc.com/rs/search/combinedcms/view.xml?profile=12000000&id=10001147',
    defaultCategory: 'business',
    language: 'en',
    country: 'US',
    region: 'North America',
    enabled: true,
    priority: 2,
    reliabilityScore: 91,
    categoryCoverage: ['business', 'finance', 'economy', 'markets'],
  },
  
  // India
  {
    id: 'the-hindu-national',
    name: 'The Hindu',
    type: 'rss',
    url: 'https://www.thehindu.com/news/national/feeder/default.rss',
    defaultCategory: 'india',
    language: 'en',
    country: 'IN',
    region: 'South Asia',
    enabled: true,
    priority: 1,
    reliabilityScore: 95,
    categoryCoverage: ['india', 'politics', 'economy', 'national'],
  },
  {
    id: 'ndtv-latest',
    name: 'NDTV',
    type: 'rss',
    url: 'https://feeds.feedburner.com/ndtvnews-latest',
    defaultCategory: 'india',
    language: 'en',
    country: 'IN',
    region: 'South Asia',
    enabled: true,
    priority: 1,
    reliabilityScore: 88,
    categoryCoverage: ['india', 'national', 'entertainment', 'business'],
  },
  
  // World
  {
    id: 'bbc-world',
    name: 'BBC News - World',
    type: 'rss',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    defaultCategory: 'world',
    language: 'en',
    country: 'UK',
    region: 'Global',
    enabled: true,
    priority: 1,
    reliabilityScore: 96,
    categoryCoverage: ['world', 'politics', 'science', 'business'],
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    type: 'rss',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    defaultCategory: 'world',
    language: 'en',
    country: 'QA',
    region: 'Middle East & Global',
    enabled: true,
    priority: 2,
    reliabilityScore: 89,
    categoryCoverage: ['world', 'politics', 'human-rights', 'economy'],
  }
];

export function getEnabledSources() {
  return SOURCES.filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
}
