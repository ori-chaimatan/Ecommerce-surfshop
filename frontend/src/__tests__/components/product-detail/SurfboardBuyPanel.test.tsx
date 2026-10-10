import { act, fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cartContext, renderWithCart } from '../cart/cart-test-utils';
import { SurfboardBuyPanel } from '@/components/product-detail/surfboard/SurfboardBuyPanel';

const SIZES = [
  { label: '5\'10" · 27.6L', soldOut: true, key: '5-10-27.6' },
  { label: '6\'0" · 29.4L', soldOut: false, key: '6-0-29.4' },
  { label: '6\'2" · 31L', soldOut: false, key: '6-2-31' },
];

function select() {
  return screen.getByRole('combobox', { name: 'Dimensions' }) as HTMLSelectElement;
}

describe('SurfboardBuyPanel (AC11)', () => {
  it('lists every size in order, disabling sold-out ones, and selects the first in-stock size', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    const options = screen.getAllByRole('option') as HTMLOptionElement[];
    expect(options.map((option) => option.textContent)).toEqual(['5\'10" · 27.6L — Sold out', '6\'0" · 29.4L', '6\'2" · 31L']);
    expect(options.map((option) => option.disabled)).toEqual([true, false, false]);
    expect(select().value).toBe('1');
  });

  it('changes the selected size', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    fireEvent.change(select(), { target: { value: '2' } });

    expect(select().value).toBe('2');
  });

  it('shows the price and an enabled Add to Cart button', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getByText('$829')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: 'Add to Cart' });
    expect(button).toBeEnabled();
    expect(button).toHaveAttribute('type', 'button');
  });

  it('uses the shared ButtonCTA styling for Add to Cart', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getByRole('button', { name: 'Add to Cart' })).toHaveClass('bg-horizon', 'rounded-[9px]', 'border-2', 'tracking-[0.02em]', 'disabled:bg-muted');
  });

  it('disables the select and shows a disabled Sold out button when nothing is in stock', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={[{ label: '6\'0" · 29.4L', soldOut: true, key: '6-0-29.4' }]} defaultSizeIndex={-1} />);

    expect(select()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Add to Cart' })).not.toBeInTheDocument();
  });

  it('has no select and a disabled Sold out button when there are no sizes', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={[]} defaultSizeIndex={-1} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });

  it('shows the trust list', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Free shipping over $75',
      '30-day returns',
      'Ships in 3–5 business days',
    ]);
  });

  it('has no wishlist, share or extra selects (AC12)', () => {
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />);

    expect(screen.getAllByRole('combobox')).toHaveLength(1);
    expect(screen.queryByText(/wishlist|share|material|fin system|more options/i)).not.toBeInTheDocument();
  });
});

describe('SurfboardBuyPanel Add to Cart (add-to-cart AC9)', () => {
  it('adds the selected board size to the cart', async () => {
    const value = cartContext();
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />, value);

    fireEvent.change(screen.getByRole('combobox', { name: 'Dimensions' }), { target: { value: '2' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    });
    expect(value.add).toHaveBeenCalledWith('board-doc', '6-2-31');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('reads "Adding…" and is disabled while the request runs', async () => {
    let finish: (result: 'added') => void = () => {};
    const value = cartContext({ add: vi.fn(() => new Promise<'added'>((resolve) => (finish = resolve))) });
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />, value);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled();
    await act(async () => finish('added'));
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('explains a failure and a size that just sold out', async () => {
    const add = vi.fn().mockResolvedValueOnce('error').mockResolvedValueOnce('sold-out');
    renderWithCart(<SurfboardBuyPanel documentId="board-doc" price="$829" sizes={SIZES} defaultSizeIndex={1} />, cartContext({ add }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't add to cart. Try again.");
    expect(screen.getByRole('alert')).toHaveClass('text-danger');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('This size just sold out.');
  });
});
