import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CheckoutSummary } from '@/components/checkout/CheckoutSummary';
import { makeCart, makeLine } from '../cart/cart-test-utils';

const board = makeLine({ key: 'b1:6-0', productDocumentId: 'b1', name: 'CI Pro', sizeLabel: `6'0" · 29.9L`, lineTotal: '$600', unitAmount: 600 });
const shorts = makeLine({ key: 's1:M', productDocumentId: 's1', name: 'Samurai', sizeLabel: 'M', quantity: 2, lineTotal: '$79.98', unitAmount: 39.99, image: null });

describe('CheckoutSummary (checkout AC9, AC10, AC12)', () => {
  it('lists each line with its size, quantity and line total', () => {
    render(<CheckoutSummary cart={makeCart([board, shorts], { subtotal: '$679.98', subtotalAmount: 679.98 })} shippingMethod="standard" changedKeys={new Set()} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0]).getByText('CI Pro')).toBeInTheDocument();
    expect(within(items[0]).getByText(`6'0" · 29.9L`)).toBeInTheDocument();
    expect(within(items[0]).getByText('$600')).toHaveClass('font-mono');
    expect(within(items[1]).getByText('M · Qty 2')).toBeInTheDocument();
    expect(within(items[0]).getByRole('img', { name: 'Samurai Pro' })).toBeInTheDocument();
  });

  it('totals with the chosen shipping method', () => {
    const cart = makeCart([shorts], { subtotal: '$39.99', subtotalAmount: 39.99 });
    const { rerender } = render(<CheckoutSummary cart={cart} shippingMethod="standard" changedKeys={new Set()} />);
    expect(screen.getByText('Shipping').nextSibling).toHaveTextContent('$12');
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('$51.99');

    rerender(<CheckoutSummary cart={cart} shippingMethod="express" changedKeys={new Set()} />);
    expect(screen.getByText('Total').nextSibling).toHaveTextContent('$64.99');
  });

  it('shows Free shipping over the threshold, and the tax note', () => {
    render(<CheckoutSummary cart={makeCart([board], { subtotal: '$600', subtotalAmount: 600 })} shippingMethod="standard" changedKeys={new Set()} />);
    expect(screen.getByText('Shipping').nextSibling).toHaveTextContent('Free');
    expect(screen.getByText('Taxes are not included in this demo.')).toBeInTheDocument();
  });

  it('marks lines that need attention', () => {
    render(
      <CheckoutSummary
        cart={makeCart([makeLine({ ...board, soldOut: true, blocked: true }), shorts])}
        shippingMethod="standard"
        changedKeys={new Set(['s1:M'])}
      />
    );
    expect(screen.getByText('Sold out')).toHaveClass('text-danger');
    expect(screen.getByText('Price or quantity updated.')).toBeInTheDocument();
  });

  it('has no discount code and no quantity badge', () => {
    render(<CheckoutSummary cart={makeCart([board])} shippingMethod="standard" changedKeys={new Set()} />);
    expect(screen.queryByPlaceholderText(/discount/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
