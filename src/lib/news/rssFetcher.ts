import Parser from 'rss-parser';
import { NewsSourceConfig } from './sourceRegistry';

const parser = new Parser({
  customFields: {
    item: ['media:content', 'media:thumbnail', 'enclosure', 'author', 'dc:creator'],
  },
  timeout: 10000, // 10 seconds timeout
});

export interface ParsedNewsItem {
  title: string;
  originalUrl: string;
  description?: string;
  publishedAt?: Date;
  author?: string;
  imageUrl?: string;
  externalId?: string;
}

export async function fetchRssFeed(source: NewsSourceConfig): Promise<ParsedNewsItem[]> {
  try {
    const feed = await parser.parseURL(source.url);
    const items: ParsedNewsItem[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;

      // Extract image if available
      let imageUrl: string | undefined;
      
      if (item['media:content'] && item['media:content'].$) {
        imageUrl = item['media:content'].$.url;
      } else if (item['media:thumbnail'] && item['media:thumbnail'].$) {
        imageUrl = item['media:thumbnail'].$.url;
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type?.startsWith('image/')) {
        imageUrl = item.enclosure.url;
      }
      
      // Clean description (remove basic HTML tags if any, though full sanitation is better at render time)
      let description = item.contentSnippet || item.content || item.summary || '';
      if (description.length > 500) {
        description = description.substring(0, 497) + '...';
      }

      // Try to parse published date
      let publishedAt: Date | undefined;
      if (item.pubDate || item.isoDate) {
        const d = new Date(item.isoDate || item.pubDate!);
        if (!isNaN(d.getTime())) {
          publishedAt = d;
        }
      }

      items.push({
        title: item.title.trim(),
        originalUrl: item.link.trim(),
        description: description.trim(),
        publishedAt,
        author: item.creator || item.author || item['dc:creator'],
        imageUrl,
        externalId: item.guid || item.id,
      });
    }

    return items;
  } catch (error: any) {
    console.error(`Failed to fetch RSS feed for ${source.id}:`, error.message);
    throw error;
  }
}
