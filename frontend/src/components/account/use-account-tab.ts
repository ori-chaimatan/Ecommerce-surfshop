'use client';

import { useCallback, useEffect, useState } from 'react';

export type AccountTab = 'overview' | 'details';
export type AccountSection = 'wishlist' | 'orders';

/** Not the hash names themselves, so the browser doesn't jump to a section in a hidden panel. */
export const SECTION_IDS: Record<AccountSection, string> = {
  wishlist: 'account-wishlist',
  orders: 'account-orders',
};

/** Lets the panel render before scrolling into it (the design's 50ms). */
const SCROLL_DELAY = 50;

/** `#details`/`#account` → Account Details; `#wishlist`/`#orders` → the overview, scrolled to it. */
export function resolveHash(hash: string): { tab: AccountTab; scroll: AccountSection | null } {
  if (hash === 'wishlist' || hash === 'orders') return { tab: 'overview', scroll: hash };
  if (hash === 'details' || hash === 'account') return { tab: 'details', scroll: null };
  return { tab: 'overview', scroll: null };
}

/** The active My Account tab, driven by the URL hash on load and on `hashchange`. */
export function useAccountTab() {
  const [tab, setTab] = useState<AccountTab>('overview');

  useEffect(() => {
    let timer: number | undefined;
    const apply = () => {
      const resolved = resolveHash(window.location.hash.replace(/^#/, ''));
      setTab(resolved.tab);
      window.clearTimeout(timer);
      if (resolved.scroll) {
        const id = SECTION_IDS[resolved.scroll];
        timer = window.setTimeout(
          () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
          SCROLL_DELAY
        );
      }
    };

    apply();
    window.addEventListener('hashchange', apply);
    return () => {
      window.removeEventListener('hashchange', apply);
      window.clearTimeout(timer);
    };
  }, []);

  /** A tab click replaces the hash (no history entry, no hashchange). */
  const selectTab = useCallback((next: AccountTab) => {
    setTab(next);
    window.history.replaceState(null, '', `#${next}`);
  }, []);

  return { tab, selectTab };
}
