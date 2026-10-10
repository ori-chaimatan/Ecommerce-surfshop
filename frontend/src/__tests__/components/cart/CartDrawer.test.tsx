import { fireEvent, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartContext } from '@/components/cart/cart-context';
import { cartContext, makeCart, makeLine, renderWithCart } from './cart-test-utils';

const pathname = vi.hoisted(() => ({ value: '/products/samurai' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

const open = (overrides = {}) => cartContext({ drawerOpen: true, ...overrides });

describe('CartDrawer (AC11, AC15, AC16)', () => {
  beforeEach(() => {
    pathname.value = '/products/samurai';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('renders nothing while closed', () => {
    renderWithCart(<CartDrawer />, cartContext());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('is a modal dialog labelled Cart, with the count in its heading', () => {
    renderWithCart(<CartDrawer />, open({ cart: makeCart([makeLine({ quantity: 2 })]) }));

    const dialog = screen.getByRole('dialog', { name: 'Cart' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByRole('heading', { name: 'Your Cart (2)' })).toBeInTheDocument();
    expect(dialog).toHaveClass('w-[420px]', 'max-[480px]:w-full');
  });

  it('shows free shipping, lines, subtotal, View Cart and a disabled Checkout with its note', () => {
    renderWithCart(<CartDrawer />, open({ cart: makeCart([makeLine()], { subtotal: '$79', remainingForFreeShipping: null }) }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText("You've unlocked free shipping!")).toBeInTheDocument();
    expect(within(dialog).getByRole('listitem')).toBeInTheDocument();
    expect(within(dialog).getByText('Subtotal').nextSibling).toHaveTextContent('$79');
    expect(within(dialog).getByRole('link', { name: 'View Cart' })).toHaveAttribute('href', '/cart');
    expect(within(dialog).getByRole('button', { name: 'Checkout' })).toBeDisabled();
    expect(within(dialog).getByText('Checkout is coming soon.')).toBeInTheDocument();
  });

  it('asks to remove blocked lines', () => {
    renderWithCart(<CartDrawer />, open({ cart: makeCart([makeLine({ soldOut: true, blocked: true })]) }));
    expect(screen.getByText('Remove unavailable items to continue.')).toBeInTheDocument();
  });

  it('shows the empty state with Continue Shopping', () => {
    renderWithCart(<CartDrawer />, open({ cart: makeCart([]) }));
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText('Your cart is empty.')).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/products');
    expect(within(dialog).queryByText('Subtotal')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows loading and error states', () => {
    const { unmount } = renderWithCart(<CartDrawer />, open({ status: 'loading' }));
    expect(screen.getByText('Loading your cart…')).toBeInTheDocument();
    unmount();

    const value = open({ status: 'error' });
    renderWithCart(<CartDrawer />, value);
    expect(screen.getByText("Your cart couldn't be loaded right now.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(value.reload).toHaveBeenCalled();
  });

  it('closes on the X, the overlay and Escape', () => {
    const value = open();
    renderWithCart(<CartDrawer />, value);

    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }));
    fireEvent.click(screen.getByTestId('cart-overlay'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(value.closeDrawer).toHaveBeenCalledTimes(3);
  });

  it('closes when one of its links is followed, even to the current page', () => {
    const value = open({ cart: makeCart([]) });
    const { unmount } = renderWithCart(<CartDrawer />, value);
    fireEvent.click(screen.getByRole('link', { name: 'Continue Shopping' }));
    expect(value.closeDrawer).toHaveBeenCalledTimes(1);
    unmount();

    const full = open();
    renderWithCart(<CartDrawer />, full);
    fireEvent.click(screen.getByRole('link', { name: 'View Cart' }));
    expect(full.closeDrawer).toHaveBeenCalledTimes(1);
  });

  it('closes when the route changes', () => {
    const value = open();
    const { rerender } = renderWithCart(<CartDrawer />, value);
    expect(value.closeDrawer).not.toHaveBeenCalled();

    pathname.value = '/cart';
    rerender(
      <CartContext.Provider value={value}>
        <CartDrawer />
      </CartContext.Provider>
    );
    expect(value.closeDrawer).toHaveBeenCalledTimes(1);
  });

  it('locks page scroll and focuses the close button while open', () => {
    const { unmount } = renderWithCart(<CartDrawer />, open());

    expect(document.body.style.overflow).toBe('hidden');
    expect(screen.getByRole('button', { name: 'Close cart' })).toHaveFocus();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab focus inside the dialog', () => {
    renderWithCart(<CartDrawer />, open({ cart: makeCart([]) }));
    const close = screen.getByRole('button', { name: 'Close cart' });
    const last = screen.getByRole('link', { name: 'Continue Shopping' });

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(last).toHaveFocus();
  });
});
