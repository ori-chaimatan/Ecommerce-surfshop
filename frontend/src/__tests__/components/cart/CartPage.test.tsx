import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import CartRoute, { dynamic, metadata } from '@/app/[locale]/cart/page';
import { CartPage } from '@/components/cart/CartPage';
import { cartContext, makeCart, makeLine, renderWithCart } from './cart-test-utils';

vi.mock('next/navigation', () => ({ usePathname: () => '/cart' }));

describe('/cart route (AC12)', () => {
  it('is dynamic, titled and not indexed, and renders the cart page', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(metadata).toMatchObject({ title: 'Your Cart — WESTLINE', robots: { index: false, follow: false } });
    renderWithCart(<CartRoute />);
    expect(screen.getByRole('heading', { level: 1, name: 'Your Cart' })).toBeInTheDocument();
  });
});

describe('CartPage (AC12, AC14–AC17)', () => {
  it('has the Home / Cart breadcrumb and the display H1', () => {
    renderWithCart(<CartPage />);

    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(crumbs).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(crumbs).getByText('Cart')).toHaveClass('text-ink');
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-display', 'uppercase');
  });

  it('lays out shipping progress and rows beside the summary', () => {
    const { container } = renderWithCart(
      <CartPage />,
      cartContext({ cart: makeCart([makeLine(), makeLine({ key: 'p2:M', name: 'Other' })], { remainingForFreeShipping: '$20' }) })
    );

    expect(container.querySelector('[data-cart-grid]')).toHaveClass(
      'grid-cols-[1.7fr_1fr]',
      'gap-12',
      'max-[900px]:grid-cols-1'
    );
    expect(screen.getByText('Add $20 more for free shipping.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
  });

  it('notes sold-out lines blocking checkout', () => {
    renderWithCart(<CartPage />, cartContext({ cart: makeCart([makeLine({ soldOut: true, blocked: true })]) }));
    expect(screen.getByText('Sold out')).toBeInTheDocument();
    expect(screen.getByText('Remove unavailable items to continue.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
  });

  it('shows the empty state without the summary or shipping block', () => {
    renderWithCart(<CartPage />, cartContext({ cart: makeCart([]) }));

    expect(screen.getByText('Your cart is empty.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/products');
    expect(screen.queryByRole('heading', { name: 'Order Summary' })).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows a skeleton while loading', () => {
    renderWithCart(<CartPage />, cartContext({ status: 'loading' }));
    const busy = screen.getByLabelText('Loading your cart…');
    expect(busy).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('Your cart is empty.')).not.toBeInTheDocument();
  });

  it('shows the load error with Retry', () => {
    const value = cartContext({ status: 'error' });
    renderWithCart(<CartPage />, value);

    expect(screen.getByText("Your cart couldn't be loaded right now.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(value.reload).toHaveBeenCalled();
  });

  it('shows none of the hidden design items (AC17)', () => {
    const { container } = renderWithCart(<CartPage />);
    const text = container.textContent ?? '';
    for (const hidden of [/promo/i, /coupon/i, /discount code/i, /you might also like/i, /recommended/i, /note/i, /wishlist/i, /save for later/i, /tax\b(?!es and shipping)/i, /estimated shipping/i]) {
      expect(text).not.toMatch(hidden);
    }
    expect(container.querySelector('textarea, input')).toBeNull();
  });
});
