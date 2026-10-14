import { describe, expect, it } from 'vitest';
import { isWishlistSlug } from '@/lib/wishlist/slug';

describe('isWishlistSlug (wishlist AC4)', () => {
  it.each(['samurai', 'tideline-6-0-performance-shortboard', 'a1', 'a'.repeat(120)])('accepts %s', (slug) => {
    expect(isWishlistSlug(slug)).toBe(true);
  });

  it.each(['', 'UPPER', '-a', 'a-', 'a--b', 'a b', '../x', 'a/b', 'a?b=1', 'a'.repeat(121), 3, null, undefined, ['a']])(
    'rejects %s',
    (slug) => {
      expect(isWishlistSlug(slug)).toBe(false);
    }
  );
});
