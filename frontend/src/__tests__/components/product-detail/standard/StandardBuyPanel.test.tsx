import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StandardBuyPanel } from '@/components/product-detail/standard/StandardBuyPanel';

const SIZES = [
  { label: 'S', soldOut: true, lowStock: false },
  { label: 'M', soldOut: false, lowStock: false },
  { label: 'L', soldOut: false, lowStock: true },
  { label: 'XL', soldOut: false, lowStock: false },
];

function sizeGroup() {
  return screen.getByRole('group', { name: /^Size/ });
}

describe('StandardBuyPanel sizes (AC11)', () => {
  it('renders one button per size in order and selects the default', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    const buttons = within(sizeGroup()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['S', 'M', 'L!', 'XL']);
    expect(within(sizeGroup()).getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sizeGroup()).getByRole('button', { name: 'XL' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Size — M')).toBeInTheDocument();
  });

  it('selects a size on click and updates the label', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'XL' }));

    expect(within(sizeGroup()).getByRole('button', { name: 'XL' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sizeGroup()).getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Size — XL')).toBeInTheDocument();
  });

  it('lays the grid out 5 across, 4 at ≤420px', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    expect(sizeGroup().querySelector('.grid')).toHaveClass('grid-cols-5', 'gap-2', 'max-[420px]:grid-cols-4');
  });
});

describe('StandardBuyPanel stock (AC12)', () => {
  it('disables a sold-out size, strikes it through and names it as sold out', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    const soldOut = within(sizeGroup()).getByRole('button', { name: 'S — Sold out' });
    expect(soldOut).toBeDisabled();
    expect(soldOut).toHaveClass('line-through', 'text-muted');
    fireEvent.click(soldOut);
    expect(screen.getByText('Size — M')).toBeInTheDocument();
  });

  it('flags a low-stock size and shows the note only while it is selected', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    const low = within(sizeGroup()).getByRole('button', { name: 'L — Low stock' });
    expect(within(low).getByText('!')).toHaveClass('bg-danger');
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();

    fireEvent.click(low);

    expect(screen.getByText('Low stock')).toHaveClass('text-danger');
    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'M' }));
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });

  it('shows the low-stock note straight away when the default size is low', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={2} />);

    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });
});

describe('StandardBuyPanel Add to Cart (AC12, AC13)', () => {
  it('is an inert, enabled Add to Cart button while a size is in stock', () => {
    render(<StandardBuyPanel sizes={SIZES} defaultSizeIndex={1} />);

    const cta = screen.getByRole('button', { name: 'Add to Cart' });
    expect(cta).toBeEnabled();
    expect(cta).toHaveAttribute('type', 'button');
  });

  it('reads "Sold out" and is disabled when every size is sold out', () => {
    const allSoldOut = SIZES.map((size) => ({ ...size, soldOut: true, lowStock: false }));
    render(<StandardBuyPanel sizes={allSoldOut} defaultSizeIndex={-1} />);

    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(within(sizeGroup()).queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('has no size grid and a disabled "Sold out" button when there are no sizes', () => {
    render(<StandardBuyPanel sizes={[]} defaultSizeIndex={-1} />);

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });
});
