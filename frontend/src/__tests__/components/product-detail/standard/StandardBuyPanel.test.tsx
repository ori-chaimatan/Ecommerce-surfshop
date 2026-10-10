import { act, fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { cartContext, renderWithCart } from '../../cart/cart-test-utils';
import { StandardBuyPanel } from '@/components/product-detail/standard/StandardBuyPanel';

const SIZES = [
  { label: 'S', soldOut: true, lowStock: false, key: 'S' },
  { label: 'M', soldOut: false, lowStock: false, key: 'M' },
  { label: 'L', soldOut: false, lowStock: true, key: 'L' },
  { label: 'XL', soldOut: false, lowStock: false, key: 'XL' },
];

function sizeGroup() {
  return screen.getByRole('group', { name: /^Size/ });
}

describe('StandardBuyPanel sizes (AC11)', () => {
  it('renders one button per size in order and selects the default', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    const buttons = within(sizeGroup()).getAllByRole('button');
    expect(buttons.map((button) => button.textContent)).toEqual(['S', 'M', 'L!', 'XL']);
    expect(within(sizeGroup()).getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sizeGroup()).getByRole('button', { name: 'XL' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Size — M')).toBeInTheDocument();
  });

  it('selects a size on click and updates the label', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'XL' }));

    expect(within(sizeGroup()).getByRole('button', { name: 'XL' })).toHaveAttribute('aria-pressed', 'true');
    expect(within(sizeGroup()).getByRole('button', { name: 'M' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Size — XL')).toBeInTheDocument();
  });

  it('lays the grid out 5 across, 4 at ≤420px', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    expect(sizeGroup().querySelector('.grid')).toHaveClass('grid-cols-5', 'gap-2', 'max-[420px]:grid-cols-4');
  });
});

describe('StandardBuyPanel stock (AC12)', () => {
  it('disables a sold-out size, strikes it through and names it as sold out', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    const soldOut = within(sizeGroup()).getByRole('button', { name: 'S — Sold out' });
    expect(soldOut).toBeDisabled();
    expect(soldOut).toHaveClass('line-through', 'text-muted');
    fireEvent.click(soldOut);
    expect(screen.getByText('Size — M')).toBeInTheDocument();
  });

  it('flags a low-stock size and shows the note only while it is selected', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    const low = within(sizeGroup()).getByRole('button', { name: 'L — Low stock' });
    expect(within(low).getByText('!')).toHaveClass('bg-danger');
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();

    fireEvent.click(low);

    expect(screen.getByText('Low stock')).toHaveClass('text-danger');
    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'M' }));
    expect(screen.queryByText('Low stock')).not.toBeInTheDocument();
  });

  it('shows the low-stock note straight away when the default size is low', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={2} />);

    expect(screen.getByText('Low stock')).toBeInTheDocument();
  });
});

describe('StandardBuyPanel Add to Cart (AC12, AC13)', () => {
  it('is an enabled Add to Cart button while a size is in stock', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />);

    const cta = screen.getByRole('button', { name: 'Add to Cart' });
    expect(cta).toBeEnabled();
    expect(cta).toHaveAttribute('type', 'button');
  });

  it('reads "Sold out" and is disabled when every size is sold out', () => {
    const allSoldOut = SIZES.map((size) => ({ ...size, soldOut: true, lowStock: false }));
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={allSoldOut} defaultSizeIndex={-1} />);

    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
    expect(within(sizeGroup()).queryByRole('button', { pressed: true })).not.toBeInTheDocument();
    expect(screen.getByText('Size')).toBeInTheDocument();
  });

  it('has no size grid and a disabled "Sold out" button when there are no sizes', () => {
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={[]} defaultSizeIndex={-1} />);

    expect(screen.queryByRole('group')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sold out' })).toBeDisabled();
  });
});

describe('StandardBuyPanel Add to Cart (add-to-cart AC9)', () => {
  it('adds the selected size to the cart', async () => {
    const value = cartContext();
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />, value);

    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'XL' }));
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    });
    expect(value.add).toHaveBeenCalledWith('shorts-doc', 'XL');
  });

  it('reads "Adding…" and is disabled while the request runs', async () => {
    let finish: (result: 'added') => void = () => {};
    const value = cartContext({ add: vi.fn(() => new Promise<'added'>((resolve) => (finish = resolve))) });
    renderWithCart(<StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />, value);

    fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    expect(screen.getByRole('button', { name: 'Adding…' })).toBeDisabled();
    await act(async () => finish('added'));
  });

  it('explains a size that just sold out, and clears the message on a new size', async () => {
    renderWithCart(
      <StandardBuyPanel documentId="shorts-doc" sizes={SIZES} defaultSizeIndex={1} />,
      cartContext({ add: vi.fn(async () => 'sold-out' as const) })
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add to Cart' }));
    });
    expect(screen.getByRole('alert')).toHaveTextContent('This size just sold out.');

    fireEvent.click(within(sizeGroup()).getByRole('button', { name: 'XL' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
