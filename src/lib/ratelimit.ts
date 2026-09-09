/**
 * A simple in-memory rate limiter.
 *
 * NOTE: This is per-process only. For a multi-instance deployment
 * (Railway / Render with many dynos) replace this with a Redis-backed
 * store. For a single-server / single-dyno deployment it is sufficient.
 */
export type RateLimitOptions = {
  /** Maximum number of requests allowed within the `window` window. */
  max: number;
  /** Time window in seconds. */
  window: number;
};

type Bucket = {
  count: number;
  /** Unix timestamp (seconds) at which the window resets. */
  reset: number;
};

const store = new Map<string, Bucket>();

const DEFAULTS: RateLimitOptions = { max: 60, window: 60 };

/**
 * Check whether an IP/key is allowed to make a request.
 * Returns `true` if allowed (and decrements the counter), `false` if rate-limited.
 */
export function rateLimit(
  key: string,
  opts: RateLimitOptions = DEFAULTS
): boolean {
  const now = Math.floor(Date.now() / 1000);
  const existing = store.get(key);

  if (!existing || now >= existing.reset) {
    // start a new window
    store.set(key, { count: 1, reset: now + opts.window });
    return true;
  }

  if (existing.count >= opts.max) {
    return false;
  }

  existing.count++;
  return true;
}

/**
 * Simple rate-limit wrapper for Express/Next-style API handlers.
 * Pass the request to extract the client IP automatically.
 */
import { NextRequest } from 'next/server';

export function clientIp(request: NextRequest): string {
  // x-forwarded-for is set by proxies; x-real-ip is set by some reverse proxies.
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}
