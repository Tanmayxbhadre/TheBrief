import slugify from 'slugify';
import crypto from 'crypto';

/**
 * Removes tracking parameters from URLs to prevent storing duplicates
 * when the same article has different UTM tags.
 */
export function normalizeUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    
    // List of parameters to remove
    const paramsToRemove = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      '_ga'
    ];
    
    paramsToRemove.forEach(param => url.searchParams.delete(param));
    
    // Remove trailing slash for consistency
    let cleanUrl = url.toString();
    if (cleanUrl.endsWith('/')) {
      cleanUrl = cleanUrl.slice(0, -1);
    }
    
    return cleanUrl;
  } catch (error) {
    // If it's not a valid URL (e.g. relative path), just return as is or handle it
    return rawUrl;
  }
}

/**
 * Normalizes titles for similarity checking.
 * Removes extra spaces, punctuation, and makes it lowercase.
 */
export function normalizeTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '') // Remove all non-alphanumeric except spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
}

/**
 * Creates a unique hash based on the normalized title and a portion of the URL or source.
 * This helps detect when the exact same story from the same source is re-published.
 */
export function generateContentHash(title: string, sourceId: string): string {
  const normTitle = normalizeTitle(title);
  // Hash the combination of source ID and normalized title
  return crypto.createHash('sha256').update(`${sourceId}:${normTitle}`).digest('hex');
}
