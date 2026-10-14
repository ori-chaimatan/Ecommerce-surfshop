import { fireEvent, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartNavButton } from '@/components/cart/CartNavButton';
import { cartContext, makeCart, makeLine, renderWithCart } from './cart-test-utils';

const pathname = vi.hoisted(() => ({ value: '/products/samurai' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.value }));

describe('CartNavButton (AC10)', () => {
  beforeEach(() => {
    pathname.value = '/products/samurai';
  });

  it('shows the item count in a badge and in the accessible name', () => {
    renderWithCart(<CartNavButton />, cartContext({ cart: makeCart([makeLine({ quantity: 2 }), makeLine({ key: 'b', quantity: 1 })]) }));

    const button = screen.getByRole('button', { name: 'Cart, 3 items' });
    expect(button).toHaveTextContent('3');
    expect(button.querySelector('[data-cart-count]')).toHaveClass('bg-horizon', 'font-mono', 'text-[10px]');
  });

  it('says "1 item" for a single unit', () => {
    renderWithCart(<CartNavButton />, cartContext({ cart: makeCart([makeLine()]) }));
    expect(screen.getByRole('button', { name: 'Cart, 1 item' })).toBeInTheDocument();
  });

  it('hides the badge at 0 and while loading', () => {
    const { unmount } = renderWithCart(<CartNavButton />, cartContext({ cart: makeCart([]) }));
    expect(screen.getByRole('button', { name: 'Cart' }).querySelector('[data-cart-count]')).toBeNull();
    unmount();

    renderWithCart(<CartNavButton />, cartContext({ status: 'loading', cart: makeCart([makeLine()]) }));
    expect(screen.getByRole('button', { name: 'Cart' }).querySelector('[data-cart-count]')).toBeNull();
  });

  it('toggles the drawer and tracks it with aria-expanded', () => {
    const value = cartContext({ drawerOpen: true });
    renderWithCart(<CartNavButton />, value);

    const button = screen.getByRole('button', { name: /^Cart/ });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(button);
    expect(value.toggleDrawer).toHaveBeenCalledTimes(1);
  });

  it('does not open the drawer on the cart page itself', () => {
    pathname.value = '/cart';
    const value = cartContext();
    renderWithCart(<CartNavButton />, value);

    fireEvent.click(screen.getByRole('button', { name: /^Cart/ }));
    expect(value.toggleDrawer).not.toHaveBeenCalled();
  });
});
