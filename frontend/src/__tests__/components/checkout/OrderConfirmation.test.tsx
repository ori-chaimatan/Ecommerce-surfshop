import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderConfirmation } from '@/components/checkout/OrderConfirmation';
import { toOrderView } from '@/components/checkout/checkout';
import { ORDER } from './checkout-fixtures';

describe('OrderConfirmation (checkout AC15)', () => {
  const renderOrder = () => render(<OrderConfirmation order={toOrderView(ORDER)} />);

  it('thanks the shopper and names the email and the order number', () => {
    renderOrder();
    expect(screen.getByRole('heading', { level: 1, name: 'Thank You!' })).toBeInTheDocument();
    expect(screen.getByText('Your order has been placed successfully.')).toBeInTheDocument();
    expect(screen.getByText('jamie@example.com').tagName).toBe('STRONG');
    expect(screen.getByText('Order #WL-104233')).toHaveClass('font-mono');
  });

  it('summarises the snapshot lines and totals', () => {
    renderOrder();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[1]).getByText('M · Qty 2')).toBeInTheDocument();
    expect(within(items[1]).getByText('$79.98')).toBeInTheDocument();
    expect(screen.getByText('Shipping (Express Shipping)').nextSibling).toHaveTextContent('$25');
    expect(screen.getByText('Total Paid').nextSibling).toHaveTextContent('$704.98');
  });

  it('shows where it ships, how, and how it was paid', () => {
    renderOrder();
    expect(screen.getByText('Ship to').nextSibling).toHaveTextContent('Jamie Rivera1 Ocean AveApt 2Santa Cruz, CA 95060United States');
    expect(screen.getByText('Arrives in 2–3 business days')).toBeInTheDocument();
    expect(screen.getByText('Visa •••• 4242')).toBeInTheDocument();
  });

  it('offers Continue Shopping and no View Order', () => {
    renderOrder();
    expect(screen.getByRole('link', { name: 'Continue Shopping' })).toHaveAttribute('href', '/products');
    expect(screen.queryByText(/view order/i)).not.toBeInTheDocument();
  });
});
