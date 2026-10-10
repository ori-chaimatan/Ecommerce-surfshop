import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CartLines } from '@/components/cart/CartLines';
import { cartContext, makeCart, makeLine, renderWithCart } from './cart-test-utils';

const LINE = makeLine({ quantity: 2, maxQty: 3, lineTotal: '$158' });

const items = () => screen.getAllByRole('listitem');

describe('CartLines (AC11, AC12, AC14)', () => {
  it('renders each line with photo, product link, size, line total and stepper', () => {
    renderWithCart(<CartLines variant="page" />, cartContext({ cart: makeCart([LINE]) }));

    const item = items()[0];
    expect(within(item).getByRole('link', { name: 'Samurai Pro' })).toHaveAttribute('href', '/products/samurai');
    expect(within(item).getByText('M')).toBeInTheDocument();
    expect(within(item).getByText('$158')).toHaveClass('font-mono');
    expect(within(item).getByRole('img', { name: 'Samurai Pro' })).toBeInTheDocument();
    expect(within(item).getByText('2')).toHaveClass('font-mono');
  });

  it('uses the page photo frame (110×138) or the drawer frame (76×95)', () => {
    const { unmount } = renderWithCart(<CartLines variant="page" />, cartContext({ cart: makeCart([LINE]) }));
    expect(items()[0].querySelector('[data-photo]')).toHaveClass('w-[110px]', 'h-[138px]', 'bg-surface');
    unmount();

    renderWithCart(<CartLines variant="drawer" />, cartContext({ cart: makeCart([LINE]) }));
    expect(items()[0].querySelector('[data-photo]')).toHaveClass('w-[76px]', 'h-[95px]');
  });

  it('steps the quantity within 1..maxQty', () => {
    const value = cartContext({ cart: makeCart([LINE]) });
    renderWithCart(<CartLines variant="drawer" />, value);

    fireEvent.click(screen.getByRole('button', { name: 'Increase quantity' }));
    expect(value.setQty).toHaveBeenCalledWith({ productDocumentId: 'p1', sizeKey: 'M' }, 3);
    fireEvent.click(screen.getByRole('button', { name: 'Decrease quantity' }));
    expect(value.setQty).toHaveBeenCalledWith({ productDocumentId: 'p1', sizeKey: 'M' }, 1);
  });

  it('disables − at 1 and + at maxQty', () => {
    renderWithCart(
      <CartLines variant="page" />,
      cartContext({ cart: makeCart([makeLine({ quantity: 1, maxQty: 1 })]) })
    );
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
  });

  it('removes a line', () => {
    const value = cartContext({ cart: makeCart([LINE]) });
    renderWithCart(<CartLines variant="page" />, value);

    const remove = screen.getByRole('button', { name: 'Remove Samurai Pro' });
    expect(remove).toHaveTextContent('Remove');
    fireEvent.click(remove);
    expect(value.remove).toHaveBeenCalledWith({ productDocumentId: 'p1', sizeKey: 'M' });
  });

  it('disables a line while its request is pending', () => {
    renderWithCart(<CartLines variant="page" />, cartContext({ cart: makeCart([LINE]), pendingKeys: new Set(['p1:M']) }));
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove Samurai Pro' })).toBeDisabled();
  });

  it('notes a quantity lowered to stock', () => {
    renderWithCart(
      <CartLines variant="page" />,
      cartContext({ cart: makeCart([makeLine({ quantity: 2, maxQty: 2, adjusted: true })]) })
    );
    expect(screen.getByText('Only 2 left — quantity updated.')).toHaveClass('text-danger', 'font-mono');
  });

  it('marks sold-out and unavailable lines differently, strikes their totals and hides the stepper', () => {
    renderWithCart(
      <CartLines variant="page" />,
      cartContext({
        cart: makeCart([
          makeLine({ key: 'a', soldOut: true, blocked: true, lineTotal: '$79' }),
          makeLine({ key: 'b', unavailable: true, blocked: true, lineTotal: '$80' }),
        ]),
      })
    );

    const [soldOut, unavailable] = items();
    expect(within(soldOut).getByText('Sold out')).toBeInTheDocument();
    expect(within(soldOut).queryByText('This size is no longer available.')).not.toBeInTheDocument();
    expect(within(unavailable).getByText('This size is no longer available.')).toBeInTheDocument();
    expect(within(unavailable).queryByText('Sold out')).not.toBeInTheDocument();
    expect(within(soldOut).getByText('$79')).toHaveClass('line-through');
    expect(within(unavailable).getByText('$80')).toHaveClass('line-through');
    expect(screen.queryByRole('button', { name: /quantity/ })).not.toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Remove/ })).toHaveLength(2);
  });

  it('shows the removed-items notice and a failed-update message', () => {
    renderWithCart(
      <CartLines variant="drawer" />,
      cartContext({ cart: makeCart([LINE], { removedCount: 1 }), mutationError: true })
    );
    expect(screen.getByText('An item in your cart is no longer available and was removed.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't update your cart. Try again.");
  });

  it('renders nothing for an empty cart without notices', () => {
    const { container } = renderWithCart(<CartLines variant="page" />, cartContext({ cart: makeCart([]) }));
    expect(container).toBeEmptyDOMElement();
  });

  it('still shows the removed notice when the cart became empty', () => {
    renderWithCart(<CartLines variant="page" />, cartContext({ cart: makeCart([], { removedCount: 1 }) }));
    expect(screen.getByText(/no longer available and was removed/)).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('keeps sibling lines usable while one is pending', () => {
    const value = cartContext({
      cart: makeCart([LINE, makeLine({ key: 'p2:M', productDocumentId: 'p2', name: 'Other', quantity: 1, maxQty: 2 })]),
      pendingKeys: new Set(['p1:M']),
    });
    renderWithCart(<CartLines variant="page" />, value);
    fireEvent.click(within(items()[1]).getByRole('button', { name: 'Increase quantity' }));
    expect(value.setQty).toHaveBeenCalledWith({ productDocumentId: 'p2', sizeKey: 'M' }, 2);
    expect(vi.mocked(value.setQty)).toHaveBeenCalledTimes(1);
  });
});
