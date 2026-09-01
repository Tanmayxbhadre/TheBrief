export function buildSummaryPrompt(title: string, content: string): string {
  return `You are an Executive Editor at THE BRIEF (thebrief.in).
Generate a concise, factual Quick Summary (2 to 4 bullet points) for the following story.

ARTICLE TITLE: ${title}
ARTICLE CONTENT:\n${content.slice(0, 2000)}

RULES:
- Each bullet point must convey a key fact or development.
- Maximum 25-35 words per bullet.
- No fluff or keyword stuffing.
- Return strictly a JSON object:
{
  "quickSummary": [
    "First core factual bullet point",
    "Second key implication bullet point",
    "Third forward-looking or context bullet point"
  ]
}`;
}
