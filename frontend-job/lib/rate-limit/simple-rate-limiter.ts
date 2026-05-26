/**
 * Simple in-memory rate limiter.
 * Works per-process — adequate for Next.js dev and single-instance deployments.
 * For multi-instance (Vercel edge), swap backing store to Redis/Upstash.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const store = new Map<string, Bucket>();

// Clean up expired entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of store) {
    if (now > bucket.resetAt) store.delete(key);
  }
}, 10 * 60 * 1000);

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key      Unique key (e.g. `match:userId`)
 * @param max      Max requests allowed in the window
 * @param windowMs Window length in milliseconds
 */
export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

/** Remaining requests in the current window (for X-RateLimit headers) */
export function getRateLimitInfo(key: string, max: number): { remaining: number; resetAt: number } {
  const bucket = store.get(key);
  if (!bucket || Date.now() > bucket.resetAt) return { remaining: max, resetAt: 0 };
  return { remaining: Math.max(0, max - bucket.count), resetAt: bucket.resetAt };
}
