import { createContext, useContext } from 'react';
import type { CartView } from './cart';

export type CartStatus = 'loading' | 'ready' | 'error';

/** `busy`: that line already has a request in flight, so nothing was sent. */
export type AddResult = 'added' | 'sold-out' | 'error' | 'busy';

export interface CartLineRef {
  productDocumentId: string;
  sizeKey: string;
}

export interface CartContextValue {
  cart: CartView;
  status: CartStatus;
  /** The last quantity change or removal failed; the cart was reloaded from the server. */
  mutationError: boolean;
  /** Keys (`<productDocumentId>:<sizeKey>`) of lines with a request in flight. */
  pendingKeys: ReadonlySet<string>;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  add: (productDocumentId: string, sizeKey: string) => Promise<AddResult>;
  setQty: (line: CartLineRef, quantity: number) => Promise<void>;
  remove: (line: CartLineRef) => Promise<void>;
  reload: () => Promise<void>;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function useCart() {
  const value = useContext(CartContext);
  if (!value) throw new Error('useCart must be used inside CartProvider');
  return value;
}

export const lineKey = ({ productDocumentId, sizeKey }: CartLineRef) => `${productDocumentId}:${sizeKey}`;
