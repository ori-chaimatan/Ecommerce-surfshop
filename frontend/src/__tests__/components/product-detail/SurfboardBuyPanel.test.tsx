import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SurfboardBuyPanel } from '@/components/product-detail/SurfboardBuyPanel';

const SIZES = [
  { label: '5\'10" · 27.6L', soldOut: true },
  { label: '6\'0" · 29.4L', soldOut: false },
  { label: '6\'2" · 31L', soldOut: false },
];

function select() {
  return screen.getByRole('combobox', { name: 'Dimensions' }) as HTMLSelectElement;
}

describe('SurfboardBuyPanel (AC11)', () => {
  it('lists every size in order, disabling sold-out ones, and selects the first in-stock size', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((option) => option.textContent)).toEqual(['5\'10" · 27.6L — Sold out', '6\'0" · 29.4L', '6\'2" · 31L']);
    expect(options.map((option) => option.disabled)).toEqual([true, false, false]);
    expect(select().value).toBe('1');
  });

  it('changes the selected size', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    fireEvent.change(select(), { target: { value: '2' } });

    expect(select().value).toBe('2');
  });

  it('shows the price and an enabled, inert Add to Cart button', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getByText('$829')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Add to Cart' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('uses the shared ButtonCTA styling for Add to Cart', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getByRole('button', { name: 'Add to Cart' })).toHaveClass('bg-horizon', 'rounded-[9px]', 'border-2', 'tracking-[0.02em]', 'disabled:bg-muted');
  });

  it('disables the select and shows a disabled Sold out button when nothing is in stock', () => {
    render(<SurfboardBuyPanel price="$829" sizes={[{ label: '6\'0" · 29.4L', soldOut: true }]} defaultSizeIndex={-1} />);

    expect(select()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument();
  });

  it('has no select and a disabled Sold out button when there are no sizes', () => {
    render(<SurfboardBuyPanel price="$829" sizes={[]} defaultSizeIndex={-1} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });

  it('shows the trust list', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Free shipping over $75',
      '30-day returns',
      'Ships in 3–5 business days',
    ]);
  });

  it('has no wishlist, share or extra selects (AC12)', () => {
    render(<SurfboardBuyPanel price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.queryByText(/wishlist|share|material|fin system|more options/i)).not.toBeInTheDocument();
  });
});
