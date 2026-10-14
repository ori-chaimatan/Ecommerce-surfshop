import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WishlistSection } from '@/components/wishlist/WishlistSection';
import { fakeWishlist, makeCard, withWishlist } from './wishlist-test-utils';

const ITEMS = [makeCard('newest'), makeCard('middle'), makeCard('oldest')];

function setup(items = ITEMS, wishlist = fakeWishlist(items.map((item) => item.slug))) {
  const view = render(<WishlistSection id="account-wishlist" items={items} />, { wrapper: withWishlist(wishlist) });
  const section = () => screen.getByRole('region', { name: 'Wishlist' });
  const cards = () => within(section()).queryAllByRole('article');
  return { ...view, wishlist, section, cards };
}

describe('WishlistSection (wishlist AC5-AC8)', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('lists the saved products in the given order (newest first), with "N saved" (AC5)', () => {
    const { section, cards } = setup();

    expect(section()).toHaveAttribute('id', 'account-wishlist');
    expect(within(section()).getByRole('heading', { level: 2, name: 'Wishlist' })).toBeInTheDocument();
    expect(within(section()).getByText('3 saved')).toBeInTheDocument();
    expect(cards().map((card) => within(card).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Product newest',
      'Product middle',
      'Product oldest',
    ]);
    for (const card of cards()) {
      expect(within(card).getByRole('button', { name: 'Remove from wishlist' })).toHaveAttribute('aria-pressed', 'true');
    }
    expect(within(cards()[0]).getByRole('link', { name: 'View Product newest' })).toHaveAttribute('href', '/products/newest');
  });

  it('says "1 saved" for one item', () => {
    setup([makeCard('only')]);
    expect(screen.getByText('1 saved')).toBeInTheDocument();
  });

  it('seeds the provider with the server-rendered slugs (AC5)', () => {
    const { wishlist } = setup();
    expect(wishlist.seed).toHaveBeenCalledWith(['newest', 'middle', 'oldest']);
  });

  it('has scroll arrows with the design labels (AC6)', () => {
    setup();
    expect(screen.getByRole('button', { name: 'Scroll wishlist left' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scroll wishlist right' })).toBeInTheDocument();
  });

  it('removes a card: fades it for 250ms, then drops it, toasts and updates the count (AC7)', async () => {
    const { cards, wishlist } = setup();

    await act(async () => {
      fireEvent.click(within(cards()[1]).getByRole('button', { name: 'Remove from wishlist' }));
    });
    expect(wishlist.toggle).toHaveBeenCalledWith('middle');
    expect(cards()).toHaveLength(3);
    expect(cards()[1].parentElement?.className).toContain('opacity-0');

    await act(async () => vi.advanceTimersByTime(250));
    expect(cards()).toHaveLength(2);
    expect(screen.getByText('2 saved')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Removed from wishlist.');
    expect(screen.getByRole('status').className).toContain('opacity-100');

    await act(async () => vi.advanceTimersByTime(2200));
    expect(screen.getByRole('status').className).toContain('opacity-0');
  });

  it('shows the empty state once the last card is removed (AC7)', async () => {
    setup([makeCard('only')]);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Remove from wishlist' }));
    });
    await act(async () => vi.advanceTimersByTime(250));

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getByText('0 saved')).toBeInTheDocument();
    expect(screen.getByText(/Your wishlist is empty\./)).toHaveTextContent(
      'Your wishlist is empty. Browse Surfboards or Apparel to add favorites.'
    );
    expect(screen.queryByRole('button', { name: 'Scroll wishlist right' })).toBeNull();
  });

  it('restores the card quietly when the removal fails (AC8)', async () => {
    const { cards } = setup(ITEMS, fakeWishlist(['newest', 'middle', 'oldest'], { toggle: vi.fn(async () => false) }));

    await act(async () => {
      fireEvent.click(within(cards()[0]).getByRole('button', { name: 'Remove from wishlist' }));
    });
    await act(async () => vi.advanceTimersByTime(250));

    expect(cards()).toHaveLength(3);
    expect(cards()[0].parentElement?.className).not.toContain('opacity-0');
    expect(screen.getByRole('status').className).toContain('opacity-0');
    expect(screen.getByRole('status')).toHaveTextContent('');
  });

  it('starts with the empty state when nothing is saved', () => {
    setup([]);
    expect(screen.getByText('0 saved')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Surfboards' })).toHaveAttribute('href', '/products/category/surfboards');
    expect(screen.getByRole('link', { name: 'Apparel' })).toHaveAttribute('href', '/products/category/clothing');
  });
});
