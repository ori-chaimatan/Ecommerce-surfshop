/**
 * Fixed-window rate limiting for the storefront's route handlers (the public edge).
 *
 * In-memory, so it only holds for a single Next.js instance — a multi-instance deploy needs a
 * shared store (e.g. Redis). Strapi called directly isn't covered.
 */

interface Window {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (0 when allowed). */
  retryAfter: number;
}

export function createRateLimiter({ limit, windowMs, now = Date.now }: { limit: number; windowMs: number; now?: () => number }) {
  const windows = new Map<string, Window>();

  function prune(at: number) {
    windows.forEach((window, key) => {
      if (window.resetAt <= at) windows.delete(key);
    });
  }

  return {
    hit(key: string): RateLimitResult {
      const at = now();
      prune(at);

      const window = windows.get(key) ?? { count: 0, resetAt: at + windowMs };
      window.count += 1;
      windows.set(key, window);

      return window.count <= limit
        ? { ok: true, retryAfter: 0 }
        : { ok: false, retryAfter: Math.max(1, Math.ceil((window.resetAt - at) / 1000)) };
    },
    size: () => windows.size,
  };
}

/** The client's IP: first `x-forwarded-for` hop (set by the proxy in front of Next), then `x-real-ip`. */
export function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

/** Guest cart creation: 20 new carts per IP per 10 minutes. */
export const cartCreationLimiter = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });

/** Place order: 10 attempts per IP + session per minute. */
export const checkoutLimiter = createRateLimiter({ limit: 10, windowMs: 60 * 1000 });
