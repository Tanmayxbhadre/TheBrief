export function buildTagsPrompt(title: string, category?: string, content?: string): string {
  return `You are a Senior Taxonomist at THE BRIEF (thebrief.in).
Generate 3 to 8 specific, high-relevance topic tags for the following news story.

TITLE: ${title}
${category ? `CATEGORY: ${category}` : ''}
${content ? `CONTENT SNIPPET:\n${content.slice(0, 1000)}` : ''}

RULES:
- Generate meaningful entity, topic, and sector tags (e.g., "Google", "Gemini", "Artificial Intelligence", "Antitrust").
- Avoid generic filler tags ("news", "breaking", "today", "latest", "update").
- Return strictly a JSON object:
{
  "tags": ["Tag1", "Tag2", "Tag3", "Tag4"]
}`;
}
