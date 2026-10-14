import type { ReactNode } from 'react';
import type { ProductCard } from '@/shared/components/product-card/product-card';

export interface IWishlistProviderProps {
  children: ReactNode;
  /** From the session cookie; a change (login, logout) reloads the saved set. */
  signedIn?: boolean;
}

export interface IWishlistProductCardProps {
  product: ProductCard;
  priority?: boolean;
}

export interface IWishlistButtonProps {
  slug: string;
  /** `icon`: the standard PDP `.btn-wish`; `labelled`: the surfboard PDP `.btn-outline-sm` "Wishlist". */
  variant: 'icon' | 'labelled';
}

export interface IWishlistSectionProps {
  /** The section id (the `#wishlist` scroll target). */
  id: string;
  /** The saved products, newest first, rendered with the page. */
  items: ProductCard[];
}
