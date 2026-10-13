import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CartSummary } from '@/components/cart/CartSummary';
import { cartContext, makeCart, makeLine, renderWithCart } from './cart-test-utils';

const row = (label: string) => screen.getByText(label).parentElement!;

describe('CartSummary (AC12, AC15)', () => {
  it('lists subtotal, shipping at checkout and a total equal to the subtotal', () => {
    renderWithCart(<CartSummary />, cartContext({ cart: makeCart([makeLine()], { subtotal: '$158' }) }));

    expect(screen.getByRole('heading', { name: 'Order Summary' })).toBeInTheDocument();
    expect(row('Subtotal')).toHaveTextContent('$158');
    expect(row('Shipping')).toHaveTextContent('Calculated at checkout');
    expect(row('Total')).toHaveTextContent('$158');
    expect(screen.getByText('Taxes and shipping are calculated at checkout.')).toBeInTheDocument();
  });

  it('is a sticky aside', () => {
    const { container } = renderWithCart(<CartSummary />, cartContext());
    expect(container.querySelector('aside')).toHaveClass('sticky', 'top-[88px]');
  });

  it('has a disabled Checkout with the coming-soon note and Continue Shopping', () => {
    renderWithCart(<CartSummary />, cartContext());

    expect(screen.getByRole('button', { name: 'Checkout' })).toBeDisabled();
    expect(screen.getByText('Checkout is coming soon.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/products');
  });

  it('asks to remove blocked lines', () => {
    renderWithCart(<CartSummary />, cartContext({ cart: makeCart([makeLine({ unavailable: true, blocked: true })]) }));
    const aside = screen.getByRole('complementary');
    expect(within(aside).getByText('Remove unavailable items to continue.')).toBeInTheDocument();
  });
});
