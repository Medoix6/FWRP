/**
 * Simple in-memory rate limiting
 * Note: For production with serverless, consider using Redis (e.g. @upstash/ratelimit)
 * for distributed rate limiting. This works for single-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

/**
 * Check if an identifier is rate limited.
 * Prefer passing an authenticated user ID over an IP-based identifier
 * to prevent X-Forwarded-For spoofing.
 */
export function isRateLimited(identifier: string): boolean {
  const now = Date.now();

  // Lazy cleanup: remove expired entries on each call to avoid setInterval
  if (rateLimitMap.size > 1000) {
    for (const [key, entry] of rateLimitMap.entries()) {
      if (now > entry.resetTime + WINDOW_MS) {
        rateLimitMap.delete(key);
      }
    }
  }

  const entry = rateLimitMap.get(identifier);

  if (!entry) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + WINDOW_MS,
    });
    return false;
  }

  if (now > entry.resetTime) {
    entry.count = 1;
    entry.resetTime = now + WINDOW_MS;
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export function getRateLimitInfo(identifier: string) {
  const entry = rateLimitMap.get(identifier);
  if (!entry) {
    return {
      remaining: MAX_REQUESTS,
      reset: Date.now() + WINDOW_MS,
    };
  }
  return {
    remaining: Math.max(0, MAX_REQUESTS - entry.count),
    reset: entry.resetTime,
  };
}

/**
 * Helper to get a rate-limit identifier from a request.
 * Prefers authenticated user ID over IP to prevent spoofing.
 */
export function getRateLimitId(req: { headers: { get(name: string): string | null } }, userId?: string): string {
  if (userId) return `uid:${userId}`;
  return req.headers.get('x-forwarded-for') || 'unknown';
}

