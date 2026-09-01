export function buildSeoPrompt(title: string, excerpt?: string, content?: string): string {
  return `You are an SEO Strategist at THE BRIEF (thebrief.in).
Generate optimized, brand-aligned SEO metadata for the following article.

TITLE: ${title}
${excerpt ? `EXCERPT: ${excerpt}` : ''}
${content ? `CONTENT SNIPPET:\n${content.slice(0, 1000)}` : ''}

CRITICAL LENGTH CONSTRAINTS:
- seoTitle: 50 to 60 characters ideally (do not exceed 65 characters). Must end with " — THE BRIEF".
- metaDescription: 140 to 160 characters describing the story accurately.
- No keyword stuffing.

Return strictly a JSON object:
{
  "seoTitle": "Optimized Headline — THE BRIEF",
  "metaDescription": "Concise, descriptive overview of the news story for search engines."
}`;
}
