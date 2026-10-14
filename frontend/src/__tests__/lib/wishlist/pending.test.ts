import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PENDING_KEY, PENDING_TTL_MS, markPending, takePending } from '@/lib/wishlist/pending';

const NOW = 1_800_000_000_000;

describe('wishlist pending marker (wishlist AC4)', () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('is taken once, for the same slug', () => {
    markPending('samurai', NOW);
    expect(takePending('samurai', NOW + 1000)).toBe(true);
    expect(takePending('samurai', NOW + 2000)).toBe(false);
  });

  it('does not match another slug, and is still consumed', () => {
    markPending('samurai', NOW);
    expect(takePending('tideline', NOW)).toBe(false);
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull();
    expect(takePending('samurai', NOW)).toBe(false);
  });

  it('expires after 10 minutes', () => {
    markPending('samurai', NOW);
    expect(takePending('samurai', NOW + PENDING_TTL_MS + 1)).toBe(false);
    markPending('samurai', NOW);
    expect(takePending('samurai', NOW + PENDING_TTL_MS)).toBe(true);
  });

  it('is false without a marker or with a corrupt one', () => {
    expect(takePending('samurai', NOW)).toBe(false);
    window.sessionStorage.setItem(PENDING_KEY, '{nope');
    expect(takePending('samurai', NOW)).toBe(false);
    window.sessionStorage.setItem(PENDING_KEY, JSON.stringify({ slug: 'samurai' }));
    expect(takePending('samurai', NOW)).toBe(false);
  });

  it('fails closed when storage throws', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => markPending('samurai', NOW)).not.toThrow();
    expect(takePending('samurai', NOW)).toBe(false);
  });
});
