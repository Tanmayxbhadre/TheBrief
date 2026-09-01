/**
 * In-memory token bucket rate limiter for AI generation operations.
 * Protects server-side LLM calls from abuse or unintentional click bursts.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

class InMemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();

  /**
   * Checks if an action is permitted within the rate limit window.
   * @param key Identifier for the actor (e.g. userId or IP)
   * @param limit Maximum allowed requests in the window
   * @param windowMs Window duration in milliseconds (default 60 seconds)
   */
  public check(key: string, limit: number, windowMs: number = 60_000): { allowed: boolean; remaining: number; resetInMs: number } {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetAt) {
      this.records.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      return { allowed: true, remaining: limit - 1, resetInMs: windowMs };
    }

    if (record.count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetInMs: Math.max(0, record.resetAt - now),
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: limit - record.count,
      resetInMs: Math.max(0, record.resetAt - now),
    };
  }

  /**
   * Resets limit records for testing purposes
   */
  public reset(): void {
    this.records.clear();
  }
}

export const aiRateLimiter = new InMemoryRateLimiter();
