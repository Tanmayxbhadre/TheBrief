export function buildFactCheckPrompt(
  title: string,
  content: string,
  sources?: Array<{ name: string; url: string }>
): string {
  const sourcesText = (sources || [])
    .map((s, idx) => `SOURCE ${idx + 1}: ${s.name} (${s.url})`)
    .join('\n');

  return `You are the Lead Fact-Checking Editor at THE BRIEF (thebrief.in).
Analyze the draft content below against available source metadata. Identify claims that are verified, unconfirmed, or conflicting, and generate verification flags for the human editor.

ARTICLE TITLE: ${title}
${sourcesText ? `ATTACHED SOURCES:\n${sourcesText}` : ''}
ARTICLE BODY:\n${content.slice(0, 3000)}

RULES:
- Evaluate specific claims (numbers, dates, official names, product details, quotes).
- Mark status as "verified", "unconfirmed", or "conflicting".
- Note that AI verification is an assistance tool; highlight items requiring human editor sign-off.
- Return strictly a JSON object:
{
  "claims": [
    {
      "claim": "Specific factual claim from article",
      "status": "verified",
      "note": "Corroborated by primary announcement",
      "sourceAttribution": "Primary Source"
    }
  ],
  "overallAssessment": "Brief summary of factual posture",
  "reviewFlags": {
    "needsVerification": false,
    "verificationNotes": []
  }
}`;
}
