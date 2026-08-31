export interface NewsSourceConfig {
  id: string;
  name: string;
  type: 'rss' | 'api';
  url: string;
  defaultCategory: string; // fallback if classifier doesn't match
  language: string;
  country: string;
  enabled: boolean;
  priority: number;
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
    enabled: true,
    priority: 1,
  },
  {
    id: 'theverge',
    name: 'The Verge',
    type: 'rss',
    url: 'https://www.theverge.com/rss/index.xml',
    defaultCategory: 'technology',
    language: 'en',
    country: 'US',
    enabled: true,
    priority: 1,
  },
  {
    id: 'wired',
    name: 'Wired',
    type: 'rss',
    url: 'https://www.wired.com/feed/rss',
    defaultCategory: 'technology',
    language: 'en',
    country: 'US',
    enabled: true,
    priority: 1,
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
    enabled: true,
    priority: 2,
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
    enabled: true,
    priority: 1,
  },
  {
    id: 'ndtv-latest',
    name: 'NDTV',
    type: 'rss',
    url: 'https://feeds.feedburner.com/ndtvnews-latest',
    defaultCategory: 'india',
    language: 'en',
    country: 'IN',
    enabled: true,
    priority: 1,
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
    enabled: true,
    priority: 1,
  },
  {
    id: 'al-jazeera',
    name: 'Al Jazeera',
    type: 'rss',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    defaultCategory: 'world',
    language: 'en',
    country: 'QA',
    enabled: true,
    priority: 2,
  }
];

export function getEnabledSources() {
  return SOURCES.filter((s) => s.enabled).sort((a, b) => a.priority - b.priority);
}
