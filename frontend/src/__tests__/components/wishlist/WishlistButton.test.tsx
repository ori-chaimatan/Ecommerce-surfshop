import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WishlistButton } from '@/components/wishlist/WishlistButton';
import { fakeWishlist, withWishlist } from './wishlist-test-utils';

describe('WishlistButton (wishlist AC2)', () => {
  it('icon variant: an unlabelled heart button, "Add to wishlist" when not saved', () => {
    render(<WishlistButton slug="samurai" variant="icon" />, { wrapper: withWishlist(fakeWishlist()) });

    const button = screen.getByRole('button', { name: 'Add to wishlist' });
    expect(button).toHaveAttribute('aria-pressed', 'false');
    expect(button).not.toHaveTextContent('Wishlist');
    expect(button.className).toContain('w-[52px]');
    expect(button.querySelector('svg')?.getAttribute('class')).not.toContain('fill-current');
  });

  it('labelled variant: heart + "Wishlist" text, filling its row', () => {
    render(<WishlistButton slug="tideline" variant="labelled" />, { wrapper: withWishlist(fakeWishlist()) });

    const button = screen.getByRole('button', { name: 'Add to wishlist' });
    expect(button).toHaveTextContent('Wishlist');
    expect(button.className).toContain('flex-1');
  });

  it('saved: pressed, "Remove from wishlist", filled heart (design gap: card convention)', () => {
    render(<WishlistButton slug="samurai" variant="labelled" />, { wrapper: withWishlist(fakeWishlist(['samurai'])) });

    const button = screen.getByRole('button', { name: 'Remove from wishlist' });
    expect(button).toHaveAttribute('aria-pressed', 'true');
    expect(button.querySelector('svg')?.getAttribute('class')).toContain('fill-current');
  });

  it('toggles the product on click', () => {
    const wishlist = fakeWishlist();
    render(<WishlistButton slug="samurai" variant="icon" />, { wrapper: withWishlist(wishlist) });

    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));
    expect(wishlist.toggle).toHaveBeenCalledWith('samurai');
  });
});
