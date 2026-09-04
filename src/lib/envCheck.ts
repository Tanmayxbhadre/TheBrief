/**
 * Safe server-side environment diagnostic utility.
 * 
 * CRITICAL SECURITY GUARANTEE:
 * This utility NEVER returns, prints, or exposes raw secrets, API keys,
 * or partial keys. It only reports status as 'CONFIGURED' or 'NOT CONFIGURED'.
 */

export interface EnvironmentDiagnostics {
  DATABASE: 'CONFIGURED' | 'NOT CONFIGURED';
  GEMINI: 'CONFIGURED' | 'NOT CONFIGURED';
  OPENAI: 'CONFIGURED' | 'NOT CONFIGURED';
  ANTHROPIC: 'CONFIGURED' | 'NOT CONFIGURED';
  CRON: 'CONFIGURED' | 'NOT CONFIGURED';
  ADMIN: 'CONFIGURED' | 'NOT CONFIGURED';
  AI_PRIMARY_PROVIDER: string;
  AI_FALLBACK_PROVIDER: string;
  AI_ACTIVE_PROVIDER: string;
  AI_MODEL: string;
  AI_ENABLED: 'ENABLED' | 'DISABLED';
  AUTO_PUBLISH: 'ENABLED' | 'DISABLED';
  SITE_URL: string;
}

export function getEnvironmentDiagnostics(): EnvironmentDiagnostics {
  const hasDb = !!(process.env.DATABASE_URL && process.env.DATABASE_URL.trim().length > 0);
  const hasGemini = !!(
    (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim().length > 0) ||
    (process.env.AI_API_KEY && process.env.AI_API_KEY.trim().length > 0)
  );
  const hasOpenAI = !!(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim().length > 0);
  const hasAnthropic = !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim().length > 0);
  const hasCron = !!(process.env.CRON_SECRET && process.env.CRON_SECRET.trim().length > 0);
  const hasAdmin = !!(process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.trim().length > 0);

  const primary = (process.env.AI_PRIMARY_PROVIDER || process.env.AI_PROVIDER || 'mock').toLowerCase();
  const fallback = (process.env.AI_FALLBACK_PROVIDER || 'mock').toLowerCase();

  // Resolve which provider will actually be used as active
  let activeProvider = 'mock';
  if (primary === 'gemini' && hasGemini) {
    activeProvider = 'gemini';
  } else if (primary === 'openai' && hasOpenAI) {
    activeProvider = 'openai';
  } else if (primary === 'anthropic' && hasAnthropic) {
    activeProvider = 'anthropic';
  } else if (fallback === 'gemini' && hasGemini) {
    activeProvider = 'gemini';
  } else if (fallback === 'openai' && hasOpenAI) {
    activeProvider = 'openai';
  } else if (fallback === 'anthropic' && hasAnthropic) {
    activeProvider = 'anthropic';
  }

  const model = process.env.AI_MODEL || (primary === 'gemini' ? 'gemini-3.1-flash-lite' : primary === 'openai' ? 'gpt-4o' : 'claude-3-5-sonnet-20241022');

  return {
    DATABASE: hasDb ? 'CONFIGURED' : 'NOT CONFIGURED',
    GEMINI: hasGemini ? 'CONFIGURED' : 'NOT CONFIGURED',
    OPENAI: hasOpenAI ? 'CONFIGURED' : 'NOT CONFIGURED',
    ANTHROPIC: hasAnthropic ? 'CONFIGURED' : 'NOT CONFIGURED',
    CRON: hasCron ? 'CONFIGURED' : 'NOT CONFIGURED',
    ADMIN: hasAdmin ? 'CONFIGURED' : 'NOT CONFIGURED',
    AI_PRIMARY_PROVIDER: primary,
    AI_FALLBACK_PROVIDER: fallback,
    AI_ACTIVE_PROVIDER: activeProvider,
    AI_MODEL: model,
    AI_ENABLED: process.env.AI_ENABLED !== 'false' ? 'ENABLED' : 'DISABLED',
    AUTO_PUBLISH: process.env.AUTO_PUBLISH_ENABLED === 'true' ? 'ENABLED' : 'DISABLED',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://thebrief.in',
  };
}
