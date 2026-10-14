import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeaturedSlider } from '@/components/home/featured-gear/FeaturedSlider';
import { stepCount } from '@/components/home/featured-gear/use-featured-slider';
import { fakeWishlist, makeCard, withWishlist } from '../../wishlist/wishlist-test-utils';

const CARDS = Array.from({ length: 6 }, (_, i) => makeCard(`board-${i + 1}`));

/** jsdom has no layout: give the track and its cards a size so the slider has something to measure. */
function fakeLayout({ scrollWidth, clientWidth, cardWidth }: { scrollWidth: number; clientWidth: number; cardWidth: number }) {
  const spies = [
    vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockReturnValue(scrollWidth),
    vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(clientWidth),
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(cardWidth),
  ];
  return () => spies.forEach((spy) => spy.mockRestore());
}

describe('stepCount (home-featured-gear AC3, design: one dot per snap position)', () => {
  it.each([
    [1000, 1000, 250, 1], // nothing overflows
    [1500, 1000, 250, 3], // 6 cards, 4 visible: positions 0, 1, 2
    [2000, 500, 500, 4], // 4 cards, 1 visible
    [1001, 1000, 250, 1], // a 1px overflow is not a position
  ])('scrollWidth %i, clientWidth %i, step %i → %i', (scrollWidth, clientWidth, step, expected) => {
    expect(stepCount(scrollWidth, clientWidth, step)).toBe(expected);
  });
});

describe('FeaturedSlider (home-featured-gear AC2, AC3)', () => {
  let restore = () => {};
  afterEach(() => restore());

  it('renders every product as the shared card with the wishlist heart (AC2)', () => {
    const wishlist = fakeWishlist(['board-2']);
    render(<FeaturedSlider products={CARDS} />, { wrapper: withWishlist(wishlist) });

    expect(screen.getAllByRole('article')).toHaveLength(6);
    expect(screen.getAllByRole('button', { name: 'Remove from wishlist' })).toHaveLength(1);
    fireEvent.click(screen.getAllByRole('button', { name: 'Add to wishlist' })[0]);
    expect(wishlist.toggle).toHaveBeenCalledWith('board-1');
  });

  it('hides the arrows and dots when nothing overflows', () => {
    restore = fakeLayout({ scrollWidth: 1000, clientWidth: 1000, cardWidth: 250 });
    render(<FeaturedSlider products={CARDS.slice(0, 4)} />, { wrapper: withWishlist(fakeWishlist()) });

    expect(screen.queryByRole('button', { name: 'Previous products' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Next products' })).toBeNull();
    expect(screen.queryAllByRole('button', { name: /Go to slide/ })).toHaveLength(0);
  });

  it('shows Next and one dot per position at the start; scrolling to the end swaps the arrows (AC3)', () => {
    restore = fakeLayout({ scrollWidth: 1500, clientWidth: 1000, cardWidth: 250 });
    const scrollTo = vi.fn();
    const scrollBy = vi.fn();
    HTMLElement.prototype.scrollTo = scrollTo;
    HTMLElement.prototype.scrollBy = scrollBy;
    render(<FeaturedSlider products={CARDS} />, { wrapper: withWishlist(fakeWishlist()) });

    expect(screen.queryByRole('button', { name: 'Previous products' })).toBeNull();
    const dots = screen.getAllByRole('button', { name: /Go to slide/ });
    expect(dots.map((dot) => dot.getAttribute('aria-label'))).toEqual(['Go to slide 1', 'Go to slide 2', 'Go to slide 3']);
    expect(dots[0]).toHaveAttribute('aria-current', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Next products' }));
    expect(scrollBy).toHaveBeenCalledWith({ left: 250, behavior: 'smooth' });
    fireEvent.click(dots[2]);
    expect(scrollTo).toHaveBeenCalledWith({ left: 500, behavior: 'smooth' });

    const track = screen.getAllByRole('article')[0].closest('[data-track]') as HTMLElement;
    act(() => {
      track.scrollLeft = 500;
      fireEvent.scroll(track);
    });
    expect(screen.queryByRole('button', { name: 'Next products' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Previous products' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to slide 3' })).toHaveAttribute('aria-current', 'true');
  });
});
