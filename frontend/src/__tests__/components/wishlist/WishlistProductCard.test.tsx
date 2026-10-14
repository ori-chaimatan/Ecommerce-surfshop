import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WishlistProductCard } from '@/components/wishlist/WishlistProductCard';
import { fakeWishlist, makeCard, withWishlist } from './wishlist-test-utils';

describe('WishlistProductCard (wishlist AC1)', () => {
  it("shows the shared card's heart with the saved state, and toggles by slug", () => {
    const wishlist = fakeWishlist(['saved-one']);
    const { rerender } = render(<WishlistProductCard product={makeCard('saved-one')} />, { wrapper: withWishlist(wishlist) });

    const heart = screen.getByRole('button', { name: 'Remove from wishlist' });
    expect(heart).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(heart);
    expect(wishlist.toggle).toHaveBeenCalledWith('saved-one');

    rerender(<WishlistProductCard product={makeCard('other')} />);
    expect(screen.getByRole('button', { name: 'Add to wishlist' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('link', { name: 'View Product other' })).toHaveAttribute('href', '/products/other');
  });
});
