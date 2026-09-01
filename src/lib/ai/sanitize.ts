/**
 * Sanitizer for untrusted AI text outputs.
 * Strips script tags, javascript: pseudo-protocol URIs, inline event handlers,
 * and dangerous embedding payloads to prevent XSS.
 */

export function sanitizeAiText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  return raw
    // Remove script tags and contents
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove inline event handlers like onclick, onload, onerror
    .replace(/\son\w+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\son\w+\s*=\s*[^>\s]+/gi, '')
    // Remove javascript: URI protocols
    .replace(/javascript:[^"'\s)]*/gi, '')
    // Remove data: text/html protocols
    .replace(/data:text\/html[^"'\s)]*/gi, '')
    // Remove iframe/object/embed tags
    .replace(/<(iframe|object|embed|applet)\b[^>]*>/gi, '')
    .replace(/<\/(iframe|object|embed|applet)>/gi, '')
    .trim();
}

/**
 * Recursively sanitizes strings across structured objects returned by AI models.
 */
export function sanitizeStructuredAiOutput<T>(input: T): T {
  if (input === null || input === undefined) {
    return input;
  }

  if (typeof input === 'string') {
    return sanitizeAiText(input) as unknown as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeStructuredAiOutput(item)) as unknown as T;
  }

  if (typeof input === 'object') {
    const cleanObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      cleanObj[key] = sanitizeStructuredAiOutput(value);
    }
    return cleanObj as T;
  }

  return input;
}
