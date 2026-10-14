/**
 * A product slug as the wishlist accepts it. Same rule as cms/src/api/wishlist/wishlist-logic.ts;
 * checked before any wishlist request and before an auto-save from `?wishlist=`.
 */
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 120;

export function isWishlistSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= SLUG_MAX && SLUG.test(value);
}
