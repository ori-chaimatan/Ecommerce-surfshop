/**
 * Pure wishlist rules. Same slug format as the storefront's frontend/src/lib/wishlist/slug.ts,
 * which checks it before any request. No Strapi calls here — wishlist-store.ts does the reads
 * and writes.
 */

export type WishlistErrorCode = 'bad-request' | 'unauthorized' | 'not-found';

export class WishlistError extends Error {
  constructor(
    readonly code: WishlistErrorCode,
    message: string = code
  ) {
    super(message);
  }
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SLUG_MAX = 120;

export function parseSlug(value: unknown): string {
  if (typeof value !== 'string' || value.length > SLUG_MAX || !SLUG.test(value)) {
    throw new WishlistError('bad-request', 'A valid product slug is required.');
  }
  return value;
}
