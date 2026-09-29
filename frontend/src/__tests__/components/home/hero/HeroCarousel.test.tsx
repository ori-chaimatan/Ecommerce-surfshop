import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HeroCarousel } from '@/components/home/hero/HeroCarousel';
import type { HeroSlide } from '@/lib/strapi/homepage';

const SLIDES: HeroSlide[] = [
  {
    headline: 'Westline',
    cta: { text: 'Shop Now', href: '/catalog', target: '_self' },
    image: { src: 'http://localhost:1337/uploads/slide_1.jpg', width: 1050, height: 699 },
  },
  {
    headline: 'Find your Surfboard',
    subtext: 'Five questions, one board.',
    cta: { text: 'Take the Finder', href: '/surfboard-finder', target: '_self' },
    image: { src: 'http://localhost:1337/uploads/slide_2.jpg', width: 1920, height: 1080 },
  },
  {
    headline: 'The Dawn Patrol Collection',
    cta: { text: 'Shop the Collection', href: 'https://example.com/dawn-patrol', target: '_self' },
    image: { src: 'http://localhost:1337/uploads/slide_3.jpg', width: 1742, height: 788 },
  },
];

function mockMatchMedia({ reducedMotion = false, hover = true } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reducedMotion : query.includes('hover') ? hover : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );
}

function realSlides(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-slide]:not([data-clone])'));
}

function activeIndex(container: HTMLElement) {
  return realSlides(container).findIndex((slide) => slide.getAttribute('aria-hidden') === 'false');
}

function dots() {
  return screen.getAllByRole('button', { name: /^Slide \d$/ });
}

describe('HeroCarousel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockMatchMedia();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders every slide in the markup, in order, with headline, subtext and CTA (AC1, AC2)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    const slides = realSlides(container);
    expect(slides).toHaveLength(3);
    expect(slides.map((s) => s.querySelector('h1, h2')?.textContent)).toEqual([
      'Westline',
      'Find your Surfboard',
      'The Dawn Patrol Collection',
    ]);
    expect(slides[1]).toHaveTextContent('Five questions, one board.');
    expect(slides[2].querySelector('a')).toHaveAttribute('href', 'https://example.com/dawn-patrol');
  });

  it('is a labelled carousel region; only the first headline is an h1 and images are decorative (AC11)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    const region = container.querySelector('section')!;
    expect(region).toHaveAttribute('aria-roledescription', 'carousel');
    expect(region).toHaveAttribute('aria-label', 'Featured');
    expect(container.querySelectorAll('h1')).toHaveLength(1);
    expect(container.querySelector('h1')).toHaveTextContent('Westline');
    realSlides(container).forEach((slide) => expect(slide.querySelector('img')).toHaveAttribute('alt', ''));
    expect(screen.getByRole('button', { name: 'Previous slide' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next slide' })).toBeInTheDocument();
  });

  it('hides inactive slides from assistive tech and removes their CTAs from the tab order (AC11)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    const [first, second] = realSlides(container);
    expect(first).toHaveAttribute('aria-hidden', 'false');
    expect(first.querySelector('a')).not.toHaveAttribute('tabindex', '-1');
    expect(second).toHaveAttribute('aria-hidden', 'true');
    expect(second).toHaveAttribute('inert');
    expect(second.querySelector('a')).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('link', { name: 'Shop Now' })).toHaveAttribute('href', '/catalog');
  });

  it('loads the first slide image with priority and lazy-loads the rest (AC14)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    const images = realSlides(container).map((s) => s.querySelector('img')!);
    expect(images[0]).not.toHaveAttribute('loading', 'lazy');
    expect(images[1]).toHaveAttribute('loading', 'lazy');
    expect(images[2]).toHaveAttribute('loading', 'lazy');
  });

  it('moves with the arrows, looping in both directions (AC6, AC7)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(activeIndex(container)).toBe(1);

    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(activeIndex(container)).toBe(0);

    act(() => vi.advanceTimersByTime(400));
    fireEvent.click(screen.getByRole('button', { name: 'Previous slide' }));
    expect(activeIndex(container)).toBe(2);
  });

  it('jumps to a slide from its dot and marks the active dot (AC7)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    expect(dots().map((d) => d.getAttribute('aria-current'))).toEqual(['true', 'false', 'false']);

    fireEvent.click(dots()[2]);

    expect(activeIndex(container)).toBe(2);
    expect(dots().map((d) => d.getAttribute('aria-current'))).toEqual(['false', 'false', 'true']);
  });

  it('auto-advances every 5 seconds (AC8)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    act(() => vi.advanceTimersByTime(4999));
    expect(activeIndex(container)).toBe(0);
    act(() => vi.advanceTimersByTime(1));
    expect(activeIndex(container)).toBe(1);
    act(() => vi.advanceTimersByTime(5000));
    expect(activeIndex(container)).toBe(2);
  });

  it('restarts the autoplay timer after an interaction (AC7)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    act(() => vi.advanceTimersByTime(4000));
    fireEvent.click(dots()[1]);
    act(() => vi.advanceTimersByTime(4000));
    expect(activeIndex(container)).toBe(1);
    act(() => vi.advanceTimersByTime(1000));
    expect(activeIndex(container)).toBe(2);
  });

  it('pauses while hovered on hover-capable devices and resumes on leave (AC8)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);
    const region = container.querySelector('section')!;

    fireEvent.mouseEnter(region);
    act(() => vi.advanceTimersByTime(10000));
    expect(activeIndex(container)).toBe(0);

    fireEvent.mouseLeave(region);
    act(() => vi.advanceTimersByTime(5000));
    expect(activeIndex(container)).toBe(1);
  });

  it('ignores hover on touch-only devices (AC8)', () => {
    mockMatchMedia({ hover: false });
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    fireEvent.mouseEnter(container.querySelector('section')!);
    act(() => vi.advanceTimersByTime(5000));
    expect(activeIndex(container)).toBe(1);
  });

  it('pauses while focus is inside and resumes on blur (AC8)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);
    const link = screen.getByRole('link', { name: 'Shop Now' });

    fireEvent.focus(link);
    act(() => vi.advanceTimersByTime(10000));
    expect(activeIndex(container)).toBe(0);

    fireEvent.blur(link);
    act(() => vi.advanceTimersByTime(5000));
    expect(activeIndex(container)).toBe(1);
  });

  it('does not autoplay under reduced motion, but controls still work (AC10)', () => {
    mockMatchMedia({ reducedMotion: true });
    const { container } = render(<HeroCarousel slides={SLIDES} />);

    act(() => vi.advanceTimersByTime(15000));
    expect(activeIndex(container)).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Next slide' }));
    expect(activeIndex(container)).toBe(1);
  });

  it('swipes to the next/previous slide past a 40px threshold (AC9)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES} />);
    const region = container.querySelector('section')!;

    function swipe(dx: number, dy = 0) {
      fireEvent.touchStart(region, { touches: [{ clientX: 200, clientY: 200 }] });
      fireEvent.touchMove(region, { touches: [{ clientX: 200 + dx, clientY: 200 + dy }] });
      fireEvent.touchEnd(region, { touches: [] });
      act(() => vi.advanceTimersByTime(400));
    }

    swipe(-30);
    expect(activeIndex(container)).toBe(0);

    swipe(-60);
    expect(activeIndex(container)).toBe(1);

    swipe(60);
    expect(activeIndex(container)).toBe(0);

    swipe(-50, 120);
    expect(activeIndex(container)).toBe(0);
  });

  it('hides the controls and does not autoplay with a single slide (AC12)', () => {
    const { container } = render(<HeroCarousel slides={SLIDES.slice(0, 1)} />);

    expect(screen.queryByRole('button', { name: 'Next slide' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Previous slide' })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('button', { name: /^Slide \d$/ })).toHaveLength(0);
    expect(container.querySelectorAll('[data-clone]')).toHaveLength(0);

    act(() => vi.advanceTimersByTime(15000));
    expect(activeIndex(container)).toBe(0);
  });
});
