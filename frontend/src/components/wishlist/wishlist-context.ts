import { createContext, useContext } from 'react';

export interface WishlistContextValue {
  isSaved: (slug: string) => boolean;
  /**
   * Saves or removes, optimistically. Resolves true when the change stuck; on failure the heart
   * reverts quietly, and a guest (or an expired session) is sent to sign in.
   */
  toggle: (slug: string) => Promise<boolean>;
  /** Seeds the saved set from a server-rendered list (the account page), so it isn't loaded twice. */
  seed: (slugs: string[]) => void;
}

export const WishlistContext = createContext<WishlistContextValue | null>(null);

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be used inside WishlistProvider');
  return value;
}
