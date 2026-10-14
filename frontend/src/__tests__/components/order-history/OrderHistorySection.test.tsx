import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OrderHistorySection } from '@/components/order-history';
import { line, order } from './order-fixtures';

const NEWER = order({ orderNumber: 'WL-200002', status: 'shipped', placedAt: '2026-10-12T10:00:00.000Z' });
const OLDER = order({ orderNumber: 'WL-200001', status: 'cancelled', placedAt: '2026-09-02T10:00:00.000Z', lines: [line({ quantity: 1, lineTotal: 79 })], subtotal: 79, total: 79 });

function setup(orders = [NEWER, OLDER]) {
  render(<OrderHistorySection id="account-orders" orders={orders} />);
  const section = () => screen.getByRole('region', { name: 'Order History' });
  const summaries = () => within(section()).queryAllByRole('button');
  return { section, summaries };
}

describe('OrderHistorySection (order-history AC1-AC6)', () => {
  it('shows the empty state and no note when there are no orders (AC1, AC6)', () => {
    const { section, summaries } = setup([]);
    expect(section()).toHaveAttribute('id', 'account-orders');
    expect(within(section()).getByText("You haven't placed any orders yet.")).toBeInTheDocument();
    expect(summaries()).toHaveLength(0);
    expect(screen.queryByText(/demo purposes/)).toBeNull();
  });

  it('lists the orders in the given (newest-first) order with their summaries (AC1, AC2, AC3)', () => {
    const { summaries } = setup();
    const [first, second] = summaries();

    expect(first).toHaveTextContent('WL-200002');
    expect(first).toHaveTextContent('Placed Oct 12, 2026');
    expect(first).toHaveTextContent('3 items');
    expect(first).toHaveTextContent('Shipped');
    expect(first).toHaveTextContent('$187');
    expect(second).toHaveTextContent('WL-200001');
    expect(second).toHaveTextContent('1 item');
    expect(second).toHaveTextContent('Cancelled');
    // Design system pill: bordered, with a Horizon (shipped/delivered) or Sand (processing/cancelled) dot.
    const dotOf = (pill: HTMLElement) => pill.querySelector('[aria-hidden]')!.className;
    expect(within(first).getByText('Shipped').className).toContain('border-border');
    expect(dotOf(within(first).getByText('Shipped'))).toContain('bg-horizon');
    expect(dotOf(within(second).getByText('Cancelled'))).toContain('bg-sand');
  });

  it('shows the note under a non-empty list (AC6)', () => {
    setup();
    expect(screen.getByText('Order status shown here is for demo purposes and does not reflect live carrier tracking.')).toBeInTheDocument();
  });

  it('toggles each order independently, with aria-expanded / aria-controls (AC4)', () => {
    const { summaries } = setup();
    const [first, second] = summaries();
    const detailOf = (button: HTMLElement) => document.getElementById(button.getAttribute('aria-controls')!)!;

    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(detailOf(first)).not.toBeVisible();

    fireEvent.click(first);
    fireEvent.click(second);
    expect(first).toHaveAttribute('aria-expanded', 'true');
    expect(second).toHaveAttribute('aria-expanded', 'true');
    expect(detailOf(first)).toBeVisible();

    fireEvent.click(first);
    expect(first).toHaveAttribute('aria-expanded', 'false');
    expect(detailOf(first)).not.toBeVisible();
    expect(detailOf(second)).toBeVisible();
  });

  it('shows the lines and totals in the detail, and no Track shipment link (AC5)', () => {
    const { summaries } = setup();
    fireEvent.click(summaries()[0]);
    const detail = document.getElementById(summaries()[0].getAttribute('aria-controls')!)!;

    const items = within(detail).getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent('Samurai Pro 22" Boardshort');
    expect(items[0]).toHaveTextContent('M · Qty 2');
    expect(items[0]).toHaveTextContent('$158');
    expect(within(items[0]).getByRole('img', { name: 'Samurai boardshort' })).toBeInTheDocument();
    expect(items[1]).toHaveTextContent('SW');
    expect(within(detail).getByText('Subtotal').parentElement).toHaveTextContent('$187');
    expect(within(detail).getByText('Shipping').parentElement).toHaveTextContent('Free');
    expect(within(detail).getByText('Total').parentElement).toHaveTextContent('$187');
    expect(screen.queryByText(/track shipment/i)).toBeNull();
  });
});
