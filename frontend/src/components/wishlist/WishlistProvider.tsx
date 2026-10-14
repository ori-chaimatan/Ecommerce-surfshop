'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { WISHLIST_API_HREF, loginHref, wishlistItemApiHref } from '@/lib/routes';
import { markPending, takePending } from '@/lib/wishlist/pending';
import { isWishlistSlug } from '@/lib/wishlist/slug';
import { WishlistContext, type WishlistContextValue } from './wishlist-context';
import type { IWishlistProviderProps } from './wishlist.types';

/** The query param that carries a guest's heart through sign-in. */
export const WISHLIST_PARAM = 'wishlist';

const currentUrl = () => new URL(window.location.href);
const pathAndQuery = (url: URL) => `${url.pathname}${url.search}`;

/** Status of a save or remove; 0 when the request never got a response. */
async function send(slug: string, method: 'PUT' | 'DELETE') {
  try {
    return (await fetch(wishlistItemApiHref(slug), { method })).status;
  } catch {
    return 0;
  }
}

/**
 * The signed-in shopper's saved slugs, for every heart on the page. Hearts are optimistic and
 * revert quietly on failure. A guest's heart marks the product and goes to sign in with
 * `?wishlist=<slug>` on the return URL; back here, the product is saved only if the marker
 * matches (lib/wishlist/pending.ts), and the param is stripped.
 */
export const WishlistProvider = ({ children, signedIn = false }: IWishlistProviderProps): React.JSX.Element => {
  const [saved, setSaved] = useState<ReadonlySet<string>>(new Set());
  const savedRef = useRef(saved);
  savedRef.current = saved;
  const seeded = useRef(false);
  // Every save/remove since the load started (final state), so a slower load can't undo them.
  const changes = useRef(new Map<string, boolean>());
  const pathname = usePathname();
  // In a ref so the effects never re-run because of the router object.
  const router = useRef(useRouter());

  const setOne = useCallback((slug: string, on: boolean) => {
    setSaved((previous) => {
      if (previous.has(slug) === on) return previous;
      const next = new Set(previous);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });
  }, []);

  /** Optimistic save or remove; reverts on anything but 200. Resolves with the status. */
  const change = useCallback(
    async (slug: string, on: boolean) => {
      changes.current.set(slug, on);
      setOne(slug, on);
      const status = await send(slug, on ? 'PUT' : 'DELETE');
      if (status !== 200) {
        changes.current.set(slug, !on);
        setOne(slug, !on);
      }
      return status;
    },
    [setOne]
  );

  const goToSignIn = useCallback((slugToSave?: string) => {
    const url = currentUrl();
    url.searchParams.delete(WISHLIST_PARAM);
    if (slugToSave) {
      markPending(slugToSave);
      url.searchParams.set(WISHLIST_PARAM, slugToSave);
    }
    router.current.push(loginHref(pathAndQuery(url)));
  }, []);

  useEffect(() => {
    if (!signedIn) {
      seeded.current = false;
      setSaved(new Set());
      return;
    }
    // Children's effects run first: the account page has already seeded the list.
    if (seeded.current) return;

    let cancelled = false;
    changes.current.clear();
    fetch(WISHLIST_API_HREF, { cache: 'no-store' })
      .then((response) => (response.ok ? response.json() : null))
      .then((body: { items?: { slug: string }[] } | null) => {
        if (cancelled || seeded.current || !Array.isArray(body?.items)) return;
        const next = new Set(body.items.map((item) => item.slug));
        changes.current.forEach((on, slug) => (on ? next.add(slug) : next.delete(slug)));
        setSaved(next);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  // Landing back from sign-in: wait until the session is in, then save once and strip the param.
  useEffect(() => {
    if (!signedIn) return;
    const url = currentUrl();
    const slug = url.searchParams.get(WISHLIST_PARAM);
    if (slug === null) return;

    url.searchParams.delete(WISHLIST_PARAM);
    router.current.replace(pathAndQuery(url), { scroll: false });
    if (!isWishlistSlug(slug) || !takePending(slug)) return;

    void change(slug, true);
  }, [signedIn, pathname, change]);

  const toggle = useCallback(
    async (slug: string) => {
      if (!isWishlistSlug(slug)) return false;
      const wasSaved = savedRef.current.has(slug);
      if (!signedIn && !wasSaved) {
        goToSignIn(slug);
        return false;
      }

      const status = await change(slug, !wasSaved);
      if (status === 401) goToSignIn(wasSaved ? undefined : slug);
      return status === 200;
    },
    [signedIn, goToSignIn, change]
  );

  const seed = useCallback((slugs: string[]) => {
    if (seeded.current) return;
    seeded.current = true;
    setSaved(new Set(slugs));
  }, []);

  const value = useMemo<WishlistContextValue>(
    () => ({ isSaved: (slug) => saved.has(slug), toggle, seed }),
    [saved, toggle, seed]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
};
