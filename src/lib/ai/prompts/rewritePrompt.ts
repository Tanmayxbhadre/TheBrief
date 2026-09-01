import { RewriteTone } from '../types';

export function buildRewritePrompt(text: string, tone: RewriteTone = 'clarity'): string {
  const instructionsByTone: Record<RewriteTone, string> = {
    clarity: 'Improve sentence structure and readability so complex ideas are immediately understandable.',
    concise: 'Remove redundancies, tighten phrasing, and eliminate passive voice while preserving all facts.',
    informative: 'Enhance contextual clarity and journalistic authority without introducing unverified claims.',
    grammar: 'Fix all typographical, grammatical, punctuation, and style issues while keeping phrasing intact.',
  };

  return `You are a Line Editor at THE BRIEF (thebrief.in).
Rewrite the following excerpt according to this objective: "${instructionsByTone[tone]}".

CRITICAL INSTRUCTIONS:
- NEVER invent facts, names, dates, quotes, or numbers.
- Preserve the exact factual meaning of the original text.
- Return strictly a JSON object:
{
  "rewrittenText": "Clean rewritten prose",
  "tone": "${tone}"
}

ORIGINAL TEXT:\n${text}`;
}
