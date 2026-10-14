import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AccountOverview } from '@/components/account/AccountOverview';
import { SECTION_IDS } from '@/components/account/use-account-tab';
import { inWishlist } from '../wishlist/wishlist-test-utils';

describe('AccountOverview (account-profile AC13)', () => {
  it('renders Wishlist first, then Order History, as scroll targets', () => {
    const { container } = render(inWishlist(<AccountOverview wishlist={[]} orders={[]} />));
    const sections = container.querySelectorAll('section');

    expect(Array.from(sections).map((section) => section.id)).toEqual([SECTION_IDS.wishlist, SECTION_IDS.orders]);
    expect(within(sections[0]).getByRole('heading', { level: 2, name: 'Wishlist' })).toBeInTheDocument();
    expect(within(sections[1]).getByRole('heading', { level: 2, name: 'Order History' })).toBeInTheDocument();
  });

  it("shows the wishlist's empty state with a 0 saved count and links to Surfboards and Apparel", () => {
    render(inWishlist(<AccountOverview wishlist={[]} orders={[]} />));

    expect(screen.getByText('0 saved')).toBeInTheDocument();
    expect(screen.getByText(/Your wishlist is empty\. Browse/)).toHaveTextContent(
      'Your wishlist is empty. Browse Surfboards or Apparel to add favorites.'
    );
    expect(screen.getByRole('link', { name: 'Surfboards' })).toHaveAttribute('href', '/products/category/surfboards');
    expect(screen.getByRole('link', { name: 'Apparel' })).toHaveAttribute('href', '/products/category/clothing');
  });

  it("shows the order history's empty state", () => {
    render(inWishlist(<AccountOverview wishlist={[]} orders={[]} />));
    expect(screen.getByText("You haven't placed any orders yet.")).toBeInTheDocument();
  });
});
