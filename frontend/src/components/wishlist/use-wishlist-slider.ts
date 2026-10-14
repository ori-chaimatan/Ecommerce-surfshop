'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

// Design profile.html slider script: CARD_W 240, GAP 20; arrows (36px, 16px from the grid) hide at ≤640px.
const CARD_W = 240;
const GAP = 20;
const SLOT = CARD_W + GAP;
const ARROWS_SPACE = 2 * 36 + 2 * 16;
const MOBILE_QUERY = '(max-width: 640px)';

/**
 * Desktop: 240px cards, and the grid pinned to whole cards so none is cut off at the edge.
 * Mobile: one full-width card per screen (swipe only). `gridWidth` null: not measured yet.
 */
export function fitSlider(available: number, mobile: boolean): { cardWidth: number; gridWidth: number | null } {
  if (available <= 0) return { cardWidth: CARD_W, gridWidth: null };
  if (mobile) return { cardWidth: available, gridWidth: available };
  const count = Math.max(1, Math.floor((available + GAP) / SLOT));
  return { cardWidth: CARD_W, gridWidth: Math.min(count * SLOT - GAP, available) };
}

/** Layout, arrow visibility and paging for the account wishlist slider. */
export function useWishlistSlider(itemCount: number) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(() => fitSlider(0, false));
  const [edges, setEdges] = useState({ atStart: true, atEnd: true });

  const updateEdges = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const maxScroll = grid.scrollWidth - grid.clientWidth;
    const noScroll = maxScroll <= 1;
    setEdges({ atStart: noScroll || grid.scrollLeft <= 1, atEnd: noScroll || grid.scrollLeft >= maxScroll - 1 });
  }, []);

  const layout = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const mobile = typeof window.matchMedia === 'function' && window.matchMedia(MOBILE_QUERY).matches;
    setFit(fitSlider(wrap.clientWidth - (mobile ? 0 : ARROWS_SPACE), mobile));
  }, []);

  useEffect(() => {
    layout();
    window.addEventListener('resize', layout);
    return () => window.removeEventListener('resize', layout);
  }, [layout, itemCount]);

  // After the new widths are in the DOM.
  useEffect(updateEdges, [fit, itemCount, updateEdges]);

  const page = useCallback((direction: 1 | -1) => {
    const grid = gridRef.current;
    grid?.scrollBy({ left: direction * grid.clientWidth, behavior: 'smooth' });
  }, []);

  return { wrapRef, gridRef, fit, edges, onScroll: updateEdges, page };
}
