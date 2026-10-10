import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartProvider } from '@/components/cart/CartProvider';
import { useCart, type CartContextValue } from '@/components/cart/cart-context';
import { makeCart, makeLine } from './cart-test-utils';

const mockRefresh = vi.hoisted(() => vi.fn());
vi.mock('next/navigation', () => ({ usePathname: () => '/products/samurai', useRouter: () => ({ refresh: mockRefresh }) }));

const mockFetch = vi.fn();
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 });
const fail = (status: number, code: string | null = null) =>
  new Response(JSON.stringify({ error: { code } }), { status });

let ctx: CartContextValue;
function Probe() {
  ctx = useCart();
  return <p>status:{ctx.status} count:{ctx.cart.count} drawer:{String(ctx.drawerOpen)}</p>;
}

const renderProvider = () =>
  render(
    <CartProvider>
      <Probe />
    </CartProvider>
  );

const CART = makeCart([makeLine({ quantity: 2 })]);
const LINE = { productDocumentId: 'p1', sizeKey: 'M' };

describe('CartProvider (AC8)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads the cart once on mount', async () => {
    mockFetch.mockResolvedValue(ok(CART));
    renderProvider();

    expect(screen.getByText(/status:loading/)).toBeInTheDocument();
    await screen.findByText(/status:ready count:2/);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/cart', { cache: 'no-store' });
  });

  it('shows the error status when the cart cannot load, and reload retries', async () => {
    mockFetch.mockResolvedValueOnce(fail(503)).mockResolvedValueOnce(ok(CART));
    renderProvider();

    await screen.findByText(/status:error/);
    await act(() => ctx.reload());
    expect(screen.getByText(/status:ready count:2/)).toBeInTheDocument();
  });

  it('add POSTs the line, replaces the cart with the response and opens the drawer', async () => {
    mockFetch.mockResolvedValueOnce(ok(makeCart([]))).mockResolvedValueOnce(ok(CART));
    renderProvider();
    await screen.findByText(/status:ready count:0/);

    let result: string | undefined;
    await act(async () => {
      result = await ctx.add('p1', 'M');
    });

    expect(result).toBe('added');
    expect(mockFetch).toHaveBeenLastCalledWith('/api/cart/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(LINE),
    });
    expect(screen.getByText(/count:2 drawer:true/)).toBeInTheDocument();
  });

  it('add reports sold-out on 409 and a generic error otherwise, leaving the drawer closed', async () => {
    mockFetch
      .mockResolvedValueOnce(ok(makeCart([])))
      .mockResolvedValueOnce(fail(409, 'sold-out'))
      .mockRejectedValueOnce(new TypeError('offline'));
    renderProvider();
    await screen.findByText(/status:ready/);

    await act(async () => {
      expect(await ctx.add('p1', 'XL')).toBe('sold-out');
      expect(await ctx.add('p1', 'M')).toBe('error');
    });
    expect(screen.getByText(/drawer:false/)).toBeInTheDocument();
  });

  it('setQty PATCHes and remove DELETEs, each replacing the cart', async () => {
    mockFetch
      .mockResolvedValueOnce(ok(CART))
      .mockResolvedValueOnce(ok(makeCart([makeLine({ quantity: 3 })])))
      .mockResolvedValueOnce(ok(makeCart([])));
    renderProvider();
    await screen.findByText(/count:2/);

    await act(() => ctx.setQty(LINE, 3));
    expect(mockFetch).toHaveBeenLastCalledWith('/api/cart/lines', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ ...LINE, quantity: 3 }),
    }));
    expect(screen.getByText(/count:3/)).toBeInTheDocument();

    await act(() => ctx.remove(LINE));
    expect(mockFetch).toHaveBeenLastCalledWith('/api/cart/lines', expect.objectContaining({
      method: 'DELETE',
      body: JSON.stringify(LINE),
    }));
    expect(screen.getByText(/count:0/)).toBeInTheDocument();
  });

  it('runs one mutation per line at a time and marks the line pending', async () => {
    let resolvePatch: (response: Response) => void = () => {};
    mockFetch
      .mockResolvedValueOnce(ok(CART))
      .mockReturnValueOnce(new Promise<Response>((resolve) => (resolvePatch = resolve)));
    renderProvider();
    await screen.findByText(/count:2/);

    let first: Promise<void> = Promise.resolve();
    act(() => {
      first = ctx.setQty(LINE, 3);
    });
    await waitFor(() => expect(ctx.pendingKeys.has('p1:M')).toBe(true));

    await act(() => ctx.setQty(LINE, 4));
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePatch(ok(makeCart([makeLine({ quantity: 3 })])));
      await first;
    });
    expect(ctx.pendingKeys.has('p1:M')).toBe(false);
  });

  it('a failed update flags mutationError and reloads the cart from the server', async () => {
    mockFetch
      .mockResolvedValueOnce(ok(CART))
      .mockResolvedValueOnce(fail(409, 'sold-out'))
      .mockResolvedValueOnce(ok(makeCart([makeLine({ soldOut: true, blocked: true })])));
    renderProvider();
    await screen.findByText(/count:2/);

    await act(() => ctx.setQty(LINE, 3));
    expect(ctx.mutationError).toBe(true);
    expect(mockFetch).toHaveBeenLastCalledWith('/api/cart', { cache: 'no-store' });
    expect(ctx.cart.lines[0].soldOut).toBe(true);
  });

  it('returns focus to the control that started add, even if it lost focus while pending (AC11)', async () => {
    mockFetch.mockResolvedValueOnce(ok(makeCart([]))).mockResolvedValueOnce(ok(CART));
    render(
      <CartProvider>
        <button type="button">Add</button>
        <Probe />
      </CartProvider>
    );
    await screen.findByText(/status:ready/);
    const button = screen.getByRole('button', { name: 'Add' });
    button.focus();

    await act(async () => {
      const pending = ctx.add('p1', 'M');
      button.blur(); // a disabled "Adding…" button drops focus
      await pending;
    });
    act(() => ctx.closeDrawer());
    expect(button).toHaveFocus();
  });

  it('toggleDrawer / openDrawer / closeDrawer', async () => {
    mockFetch.mockResolvedValue(ok(CART));
    renderProvider();
    await screen.findByText(/status:ready/);

    act(() => ctx.toggleDrawer());
    expect(screen.getByText(/drawer:true/)).toBeInTheDocument();
    act(() => ctx.closeDrawer());
    expect(screen.getByText(/drawer:false/)).toBeInTheDocument();
    act(() => ctx.openDrawer());
    expect(screen.getByText(/drawer:true/)).toBeInTheDocument();
  });

  it('reloads the cart when the session changes (login merge, logout) (AC5, AC8)', async () => {
    mockFetch.mockResolvedValueOnce(ok(CART)).mockResolvedValueOnce(ok(makeCart([])));
    const { rerender } = render(
      <CartProvider signedIn>
        <Probe />
      </CartProvider>
    );
    await screen.findByText(/count:2/);

    rerender(
      <CartProvider signedIn={false}>
        <Probe />
      </CartProvider>
    );
    await screen.findByText(/count:0/);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('refreshes the page when a cart response reports an expired session, so the header signs out', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(CART), { status: 200, headers: { 'x-westline-session': 'expired' } })
    );
    renderProvider();
    await screen.findByText(/count:2/);
    expect(mockRefresh).toHaveBeenCalledTimes(1);

    mockRefresh.mockClear();
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify(CART), { status: 200, headers: { 'x-westline-session': 'expired' } })
    );
    await act(async () => {
      await ctx.add('p1', 'M');
    });
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for normal responses', async () => {
    mockRefresh.mockClear();
    mockFetch.mockResolvedValue(ok(CART));
    renderProvider();
    await screen.findByText(/count:2/);
    expect(mockRefresh).not.toHaveBeenCalled();
  });

  it('useCart outside the provider throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/CartProvider/);
  });
});
