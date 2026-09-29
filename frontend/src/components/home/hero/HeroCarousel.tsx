'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TouchEvent, TransitionEvent } from 'react';
import type { HeroSlide as HeroSlideData } from '@/lib/strapi/homepage';
import { Icon } from '@/shared/components/icons';
import { HeroSlide } from './HeroSlide';
import { texts } from './hero-texts';

const AUTOPLAY_MS = 5000;
const SETTLE_FALLBACK_MS = 400;
const SWIPE_THRESHOLD = 40;

export function HeroCarousel({ slides }: { slides: HeroSlideData[] }) {
  const count = slides.length;
  const loop = count > 1;

  const [pos, setPos] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [touching, setTouching] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [supportsHover, setSupportsHover] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const posRef = useRef(pos);
  const animatingRef = useRef(false);
  const settleTimer = useRef<ReturnType<typeof setTimeout>>();
  const touchRef = useRef({ x: 0, y: 0, dx: 0, dy: 0 });

  posRef.current = pos;
  const active = loop ? (pos - 1 + count) % count : 0;

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setSupportsHover(window.matchMedia('(hover: hover) and (pointer: fine)').matches);
  }, []);

  useEffect(() => () => clearTimeout(settleTimer.current), []);

  const normalize = useCallback((p: number) => (p === 0 ? count : p === count + 1 ? 1 : p), [count]);

  const settle = useCallback(() => {
    clearTimeout(settleTimer.current);
    animatingRef.current = false;
    setAnimate(false);
    setPos((p) => normalize(p));
  }, [normalize]);

  const goTo = useCallback(
    (target: number) => {
      if (!loop || animatingRef.current) return;

      if (reducedMotion) {
        setAnimate(false);
        setPos(normalize(target));
        return;
      }

      animatingRef.current = true;
      setAnimate(true);
      setPos(target);
      clearTimeout(settleTimer.current);
      settleTimer.current = setTimeout(settle, SETTLE_FALLBACK_MS);
    },
    [loop, reducedMotion, normalize, settle]
  );

  const next = useCallback(() => goTo(posRef.current + 1), [goTo]);
  const prev = useCallback(() => goTo(posRef.current - 1), [goTo]);
  const restartAutoplay = () => setTimerKey((k) => k + 1);

  const paused = hovered || focused || touching;

  useEffect(() => {
    if (!loop || paused || reducedMotion) return;
    const id = setInterval(next, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [loop, paused, reducedMotion, next, timerKey]);

  function handleTransitionEnd(e: TransitionEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && e.propertyName === 'transform') settle();
  }

  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length !== 1) return;
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, dx: 0, dy: 0 };
    setTouching(true);
  }

  function handleTouchMove(e: TouchEvent) {
    if (!touching || e.touches.length !== 1) return;
    touchRef.current.dx = e.touches[0].clientX - touchRef.current.x;
    touchRef.current.dy = e.touches[0].clientY - touchRef.current.y;
  }

  function handleTouchEnd() {
    if (!touching) return;
    setTouching(false);
    const { dx, dy } = touchRef.current;
    if (Math.abs(dx) >= SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
    restartAutoplay();
  }

  const renderedSlides = loop
    ? [
        { slide: slides[count - 1], index: count - 1, clone: true },
        ...slides.map((slide, index) => ({ slide, index, clone: false })),
        { slide: slides[0], index: 0, clone: true },
      ]
    : [{ slide: slides[0], index: 0, clone: false }];

  return (
    <section
      aria-roledescription={texts.carouselRole}
      aria-label={texts.carouselLabel}
      className="relative z-0 h-[calc(100vh-64px)] min-h-[420px] overflow-hidden bg-ink"
      onMouseEnter={() => supportsHover && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className={`flex h-full w-full ${animate ? 'transition-transform duration-300 ease-[cubic-bezier(.4,0,.2,1)]' : ''}`}
        style={{ transform: `translateX(-${pos * 100}%)` }}
        onTransitionEnd={handleTransitionEnd}
      >
        {renderedSlides.map(({ slide, index, clone }, i) => (
          <HeroSlide
            key={clone ? `clone-${i}` : index}
            slide={slide}
            clone={clone}
            active={!clone && index === active}
            headingAs={clone ? 'p' : index === 0 ? 'h1' : 'h2'}
            priority={!clone && index === 0}
          />
        ))}
      </div>

      {loop && (
        <>
          <button
            type="button"
            aria-label={texts.previousSlide}
            onClick={() => {
              prev();
              restartAutoplay();
            }}
            className="absolute left-5 top-1/2 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[rgba(18,33,42,.35)] text-white hover:bg-[rgba(18,33,42,.55)] max-[640px]:left-3 max-[640px]:h-9 max-[640px]:w-9"
          >
            <Icon name="arrow-left" stroke="currentColor" strokeWidth="2" fill="none" className="h-[18px] w-[18px] max-[640px]:h-[15px] max-[640px]:w-[15px]" />
          </button>
          <button
            type="button"
            aria-label={texts.nextSlide}
            onClick={() => {
              next();
              restartAutoplay();
            }}
            className="absolute right-5 top-1/2 z-[3] flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[rgba(18,33,42,.35)] text-white hover:bg-[rgba(18,33,42,.55)] max-[640px]:right-3 max-[640px]:h-9 max-[640px]:w-9"
          >
            <Icon name="arrow-right" stroke="currentColor" strokeWidth="2" fill="none" className="h-[18px] w-[18px] max-[640px]:h-[15px] max-[640px]:w-[15px]" />
          </button>
          <div className="pointer-events-none absolute inset-x-0 bottom-14 z-[5] flex justify-center max-[640px]:bottom-10">
            <div role="group" aria-label={texts.slidesLabel} className="pointer-events-auto flex items-center gap-2">
              {slides.map((slide, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={texts.slide(index + 1)}
                  aria-current={index === active ? 'true' : 'false'}
                  onClick={() => {
                    goTo(index + 1);
                    restartAutoplay();
                  }}
                  className={`relative h-2 rounded-full transition-[width,background-color] duration-200 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] ${
                    index === active ? 'w-[22px] bg-white' : 'w-2 bg-white/45 hover:bg-white/75'
                  }`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  );
}
