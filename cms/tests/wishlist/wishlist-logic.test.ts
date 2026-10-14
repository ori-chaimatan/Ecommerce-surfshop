import { describe, expect, it } from 'vitest';
import { WishlistError, parseSlug } from '../../src/api/wishlist/wishlist-logic';

describe('parseSlug (wishlist AC4, AC9)', () => {
  it.each(['tideline-6-0-performance-shortboard', 'samurai', 'a1-b2'])('accepts %s', (slug) => {
    expect(parseSlug(slug)).toBe(slug);
  });

  it.each([
    '',
    'UPPER',
    '-leading',
    'trailing-',
    'double--dash',
    'has space',
    '../etc',
    'a/b',
    'a'.repeat(121),
    7,
    undefined,
    null,
  ])('rejects %s with bad-request', (slug) => {
    expect(() => parseSlug(slug)).toThrow(WishlistError);
    try {
      parseSlug(slug);
    } catch (error) {
      expect((error as WishlistError).code).toBe('bad-request');
    }
  });

  it('accepts exactly 120 characters', () => {
    expect(parseSlug('a'.repeat(120))).toHaveLength(120);
  });
});
