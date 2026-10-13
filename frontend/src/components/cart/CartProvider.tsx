'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SESSION_STATE_HEADER } from '@/lib/cart/constants';
import { CART_API_HREF, CART_LINES_API_HREF } from '@/lib/routes';
import { EMPTY_CART, type CartView } from './cart';
import type { ICartProviderProps } from './cart.types';
import { CartDrawer } from './CartDrawer';
import {
  CartContext,
  lineKey,
  type AddResult,
  type CartContextValue,
  type CartLineRef,
  type CartStatus,
} from './cart-context';

type LineMethod = 'POST' | 'PATCH' | 'DELETE';

/**
 * Holds the shopper's cart for the whole storefront. The server is the only source of
 * truth: every change sends one request and replaces the cart with the response — no
 * optimistic totals. Each line has at most one request in flight, and mutations run one at a
 * time: each one reads and rewrites the whole cart on the server, so two at once (on different
 * lines) could silently drop one.
 */
export const CartProvider = ({ children, signedIn = false }: ICartProviderProps): React.JSX.Element => {
  const [cart, setCart] = useState<CartView>(EMPTY_CART);
  const [status, setStatus] = useState<CartStatus>('loading');
  const [mutationError, setMutationError] = useState(false);
  const [pendingKeys, setPendingKeys] = useState<ReadonlySet<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pending = useRef(new Set<string>());
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const opener = useRef<HTMLElement | null>(null);
  const wasOpen = useRef(false);
  // In a ref so the load effect never re-runs because of the router object.
  const router = useRef(useRouter());

  // The cart routes dropped an expired session: re-render the server parts (header shows Sign In).
  const checkSession = useCallback((response: Response) => {
    if (response.headers.get(SESSION_STATE_HEADER) === 'expired') router.current.refresh();
  }, []);

  const reload = useCallback(async () => {
    try {
      const response = await fetch(CART_API_HREF, { cache: 'no-store' });
      checkSession(response);
      if (!response.ok) throw new Error(`cart responded ${response.status}`);
      setCart(await response.json());
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [checkSession]);

  useEffect(() => {
    void reload();
  }, [reload, signedIn]);

  /** Sends one line request unless that line is already busy; null when skipped or offline. */
  const sendLine = useCallback(async (line: CartLineRef, method: LineMethod, body: object) => {
    const key = lineKey(line);
    if (pending.current.has(key)) return 'busy' as const;

    pending.current.add(key);
    setPendingKeys(new Set(pending.current));
    try {
      const request = queue.current.then(() =>
        fetch(CART_LINES_API_HREF, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      );
      queue.current = request.catch(() => undefined);
      const response = await request;
      checkSession(response);
      return response;
    } catch {
      return null;
    } finally {
      pending.current.delete(key);
      setPendingKeys(new Set(pending.current));
    }
  }, [checkSession]);

  const openDrawer = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    setDrawerOpen(true);
  }, []);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => {
    if (document.activeElement instanceof HTMLElement) opener.current = document.activeElement;
    setDrawerOpen((open) => !open);
  }, []);

  // Focus goes back to whatever opened the drawer (header button or Add to Cart).
  useEffect(() => {
    if (wasOpen.current && !drawerOpen) opener.current?.focus();
    wasOpen.current = drawerOpen;
  }, [drawerOpen]);

  const add = useCallback(
    async (productDocumentId: string, sizeKey: string): Promise<AddResult> => {
      const line = { productDocumentId, sizeKey };
      // Remember the Add to Cart button now: it's disabled ("Adding…") while the request runs, which drops its focus.
      const origin = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const response = await sendLine(line, 'POST', line);
      if (response === 'busy') return 'busy';
      if (response?.status === 409) return 'sold-out';
      if (!response?.ok) return 'error';

      setCart(await response.json());
      setStatus('ready');
      setMutationError(false);
      opener.current = origin;
      setDrawerOpen(true);
      return 'added';
    },
    [sendLine]
  );

  const update = useCallback(
    async (line: CartLineRef, method: LineMethod, body: object) => {
      const response = await sendLine(line, method, body);
      if (response === 'busy') return;
      if (response?.ok) {
        setCart(await response.json());
        setMutationError(false);
        return;
      }
      setMutationError(true);
      await reload();
    },
    [sendLine, reload]
  );

  const setQty = useCallback(
    (line: CartLineRef, quantity: number) => update(line, 'PATCH', { ...line, quantity }),
    [update]
  );
  const remove = useCallback((line: CartLineRef) => update(line, 'DELETE', line), [update]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      status,
      mutationError,
      pendingKeys,
      drawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      add,
      setQty,
      remove,
      reload,
    }),
    [cart, status, mutationError, pendingKeys, drawerOpen, openDrawer, closeDrawer, toggleDrawer, add, setQty, remove, reload]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
};
