/**
 * Minimal sliding-window rate limiter suitable for Edge runtime.
 * NOTE: This is per-instance memory and best-effort only. For global limits,
 * integrate a remote store (e.g., Upstash or Redis) behind env flags.
 */

type Bucket = {
  hits: number[];
};

const buckets = new Map<string, Bucket>();

/**
 * Check and record a hit for the given key within the window.
 * @param key Unique identifier (e.g., userId or IP)
 * @param limit Max number of requests allowed in the window
 * @param windowMs Window size in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit = 30,
  windowMs = 5 * 60 * 1000
): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const reset = now + windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  // prune hits outside the window
  const since = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > since);

  if (bucket.hits.length >= limit) {
    return {
      allowed: false,
      remaining: 0,
      reset,
    };
  }

  bucket.hits.push(now);

  return {
    allowed: true,
    remaining: Math.max(0, limit - bucket.hits.length),
    reset,
  };
}

/**
 * Parse boolean-ish env flags safely.
 */
export function envEnabled(value: string | undefined, defaultOn = true): boolean {
  if (value == null) return defaultOn;
  return /^(1|true|yes|on)$/i.test(value.trim());
}
