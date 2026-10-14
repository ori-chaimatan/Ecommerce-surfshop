'use client';

import { ProductCard } from '@/shared/components/product-card';
import { useWishlist } from './wishlist-context';
import type { IWishlistProductCardProps } from './wishlist.types';

/** The shared product card with its heart wired to the wishlist (product-card AC8). */
export const WishlistProductCard = ({ product, priority }: IWishlistProductCardProps): React.JSX.Element => {
  const { isSaved, toggle } = useWishlist();

  return (
    <ProductCard
      product={product}
      priority={priority}
      isFavorite={isSaved(product.slug)}
      onToggleFavorite={(slug) => void toggle(slug)}
    />
  );
};
