/**
 * Simple in-memory rate limiting
 * Note: For production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export function isRateLimited(identifier: string): boolean {
  const now = Date.now();
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

// Cleanup old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetTime + WINDOW_MS) {
      rateLimitMap.delete(key);
    }
  }
}, 3600000);
