/**
 * Basic deterministic category classification based on keywords in title.
 */

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ai: ['ai', 'artificial intelligence', 'machine learning', 'chatgpt', 'openai', 'llm', 'gemini', 'anthropic'],
  business: ['market', 'economy', 'stocks', 'shares', 'bank', 'finance', 'revenue', 'profit', 'earnings'],
  startups: ['funding', 'seed round', 'venture capital', 'vc', 'founder', 'startup', 'incubator', 'y combinator'],
  technology: ['tech', 'software', 'hardware', 'apple', 'google', 'microsoft', 'app', 'update', 'cybersecurity'],
  gaming: ['nintendo', 'playstation', 'xbox', 'game', 'gamer', 'esports', 'steam'],
  science: ['space', 'nasa', 'research', 'discovery', 'physics', 'quantum', 'biology'],
  entertainment: ['movie', 'film', 'netflix', 'actor', 'actress', 'hollywood', 'bollywood', 'music', 'album'],
  india: ['india', 'modi', 'delhi', 'mumbai', 'bjp', 'congress', 'rbi', 'sensex'],
  world: ['global', 'un', 'world', 'international', 'europe', 'asia', 'africa', 'america']
};

export function classifyCategory(title: string, defaultCategory: string): string {
  if (!title) return defaultCategory;
  
  const lowerTitle = title.toLowerCase();
  
  // Try to match keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      // Check if keyword exists as a whole word
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerTitle)) {
        return category;
      }
    }
  }
  
  // If no keywords match, fall back to the source's default category
  return defaultCategory;
}
