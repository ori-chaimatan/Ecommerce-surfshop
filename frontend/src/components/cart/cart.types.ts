import type { ReactNode } from 'react';

export type CartVariant = 'drawer' | 'page';

export interface ICartProviderProps {
  children: ReactNode;
  /** From the session cookie; a change (login merge, logout) reloads the cart. */
  signedIn?: boolean;
}

export interface ICartLinesProps {
  /** `drawer`: compact rows (76×95 photo). `page`: the cart page rows (110×138 photo). */
  variant: CartVariant;
  /** Called when a product link is followed; the drawer closes itself, even on a same-URL link (AC11). */
  onNavigate?: () => void;
}

export interface IShippingProgressProps {
  /** Formatted amount still needed; null once free shipping is unlocked. */
  remaining: string | null;
  /** 0–1. */
  progress: number;
  variant: CartVariant;
}
