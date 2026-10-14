import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';
import { cartContext, makeCart, makeLine, renderWithCart } from '../cart/cart-test-utils';
import { ACCOUNT } from './checkout-fixtures';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router, usePathname: () => '/checkout' }));

describe('CheckoutPage (checkout AC9, AC14)', () => {
  beforeEach(() => {
    router.replace.mockReset();
    sessionStorage.clear();
  });

  it('renders the form and the summary side by side', () => {
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext({ cart: makeCart([makeLine()], { subtotalAmount: 79 }) }));

    expect(screen.getByRole('heading', { level: 1, name: 'Checkout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveClass('bg-surface');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('prefills the name from the account', () => {
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext());
    expect(screen.getByLabelText('First name')).toHaveValue('Jamie');
    expect(screen.getByLabelText('Last name')).toHaveValue('Rivera');
  });

  it('restores the saved shipping draft, never card fields', () => {
    sessionStorage.setItem('westline_checkout', JSON.stringify({ city: 'Malibu', shippingMethod: 'express', cardNumber: '4242' }));
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext());

    expect(screen.getByLabelText('City')).toHaveValue('Malibu');
    expect(screen.getByRole('radio', { name: /express shipping/i })).toBeChecked();
    expect(screen.getByLabelText('Card number')).toHaveValue('');
  });

  it('sends an empty cart back to /cart', () => {
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext({ cart: makeCart([]) }));
    expect(router.replace).toHaveBeenCalledWith('/cart');
  });

  it('shows a skeleton while the cart loads, and does not redirect', () => {
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext({ status: 'loading', cart: makeCart([]) }));
    expect(screen.getByLabelText('Loading checkout…')).toHaveAttribute('aria-busy', 'true');
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('offers a retry when the cart fails to load', () => {
    const reload = vi.fn(async () => {});
    renderWithCart(<CheckoutPage account={ACCOUNT} />, cartContext({ status: 'error', reload }));
    screen.getByRole('button', { name: 'Retry' }).click();
    expect(reload).toHaveBeenCalled();
  });
});
