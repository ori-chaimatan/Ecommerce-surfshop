import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { WishlistContext, type WishlistContextValue } from '@/components/wishlist/wishlist-context';
import type { ProductCard } from '@/shared/components/product-card/product-card';

export function fakeWishlist(saved: string[] = [], overrides: Partial<WishlistContextValue> = {}) {
  const set = new Set(saved);
  return {
    isSaved: vi.fn((slug: string) => set.has(slug)),
    toggle: vi.fn(async () => true),
    seed: vi.fn(),
    ...overrides,
  };
}

export const withWishlist = (value: WishlistContextValue) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
  };

/** Wraps a tree in a wishlist context (default: nothing saved). */
export const inWishlist = (ui: ReactNode, value: WishlistContextValue = fakeWishlist()) => (
  <WishlistContext.Provider value={value}>{ui}</WishlistContext.Provider>
);

export const makeCard = (slug: string, extra: Partial<ProductCard> = {}): ProductCard => ({
  slug,
  name: `Product ${slug}`,
  price: 79,
  href: `/products/${slug}`,
  images: [{ src: `http://localhost:1337/uploads/${slug}.jpg`, width: 800, height: 1000 }],
  imageFit: 'cover',
  ...extra,
});
