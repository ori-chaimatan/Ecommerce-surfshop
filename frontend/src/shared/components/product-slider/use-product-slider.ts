'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/** Snap positions in a track (the design's `positions()`): 1 when nothing overflows. */
export function stepCount(scrollWidth: number, clientWidth: number, step: number): number {
  const max = scrollWidth - clientWidth;
  return max > 1 && step > 0 ? Math.round(max / step) + 1 : 1;
}

/** Arrow, dot and paging state for a product track (the design's `.prod-slider` script). */
export function useProductSlider() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState({ positions: 1, current: 0, atStart: true, atEnd: true });

  const stepSize = useCallback(() => {
    const track = trackRef.current;
    const card = track?.firstElementChild as HTMLElement | null;
    if (!track || !card) return 0;
    return card.offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
  }, []);

  const update = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const step = stepSize();
    const max = track.scrollWidth - track.clientWidth;
    setState({
      positions: stepCount(track.scrollWidth, track.clientWidth, step),
      current: step > 0 ? Math.round(track.scrollLeft / step) : 0,
      atStart: track.scrollLeft <= 1,
      atEnd: track.scrollLeft >= max - 1,
    });
  }, [stepSize]);

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [update]);

  const page = (direction: 1 | -1) => trackRef.current?.scrollBy({ left: direction * stepSize(), behavior: 'smooth' });
  const goTo = (index: number) => trackRef.current?.scrollTo({ left: index * stepSize(), behavior: 'smooth' });

  return { trackRef, ...state, onScroll: update, page, goTo };
}
