import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CartContext } from '@/components/cart/cart-context';
import { usePlaceOrder } from '@/components/checkout/use-place-order';
import { cartContext, makeCart, makeLine } from '../cart/cart-test-utils';
import { ACCOUNT, FILLED_FORM } from './checkout-fixtures';

const router = vi.hoisted(() => ({ replace: vi.fn(), push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';
const cart = makeCart([makeLine({ key: 's1:M', productDocumentId: 's1', sizeKey: 'M', quantity: 2, unitAmount: 39.99 })], {
  subtotal: '$79.98',
  subtotalAmount: 79.98,
});

const mockFetch = vi.fn();
const respond = (body: unknown, status: number) => new Response(JSON.stringify(body), { status });

function setup(context = cartContext({ cart })) {
  const wrapper = ({ children }: { children: ReactNode }) => <CartContext.Provider value={context}>{children}</CartContext.Provider>;
  const hook = renderHook(() => usePlaceOrder(ACCOUNT), { wrapper });
  return { ...hook, context };
}

/** Fills every field the way a shopper would. */
function fill(result: ReturnType<typeof setup>['result']) {
  act(() => {
    for (const [field, value] of Object.entries(FILLED_FORM)) result.current.setField(field as never, value);
  });
}

const submit = async (result: ReturnType<typeof setup>['result']) => {
  await act(async () => {
    await result.current.submit({ preventDefault() {} } as never);
  });
};

describe('usePlaceOrder (checkout AC6, AC11–AC14)', () => {
  beforeEach(() => {
    sessionStorage.clear();
    sessionStorage.setItem('westline_checkout_key', KEY);
    router.replace.mockReset();
    router.push.mockReset();
    mockFetch.mockReset();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('prefills the name from the account and defaults to Standard', () => {
    const { result } = setup();
    expect(result.current.values).toMatchObject({ firstName: 'Jamie', lastName: 'Rivera', shippingMethod: 'standard', cardNumber: '' });
  });

  it('formats card inputs as they are typed', () => {
    const { result } = setup();
    act(() => {
      result.current.setField('cardNumber', '4242424242424242');
      result.current.setField('cardExpiry', '1230');
      result.current.setField('cardCvc', '12a3');
    });
    expect(result.current.values).toMatchObject({ cardNumber: '4242 4242 4242 4242', cardExpiry: '12/30', cardCvc: '123' });
  });

  it('saves shipping fields for a refresh, never card fields', () => {
    const { result } = setup();
    fill(result);
    const stored = sessionStorage.getItem('westline_checkout')!;
    expect(JSON.parse(stored)).toMatchObject({ city: 'Santa Cruz', state: 'CA', shippingMethod: 'standard' });
    expect(stored).not.toContain('4242');
  });

  it('clears a field error once the field is edited', async () => {
    const { result } = setup();
    await submit(result);
    expect(result.current.errors.city).toBeDefined();
    act(() => result.current.setField('city', 'Santa Cruz'));
    expect(result.current.errors.city).toBeUndefined();
  });

  it('validates everything on submit and focuses the first invalid field, without calling the API', async () => {
    const { result } = setup();
    const focus = { address1: vi.fn(), city: vi.fn() };
    act(() => {
      result.current.fieldRef('address1')({ focus: focus.address1 } as never);
      result.current.fieldRef('city')({ focus: focus.city } as never);
    });

    await submit(result);

    expect(Object.keys(result.current.errors)).toEqual(['address1', 'city', 'state', 'postalCode', 'cardNumber', 'cardExpiry', 'cardCvc', 'cardName']);
    expect(focus.address1).toHaveBeenCalled();
    expect(focus.city).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('places the order with the reviewed cart and the attempt key', async () => {
    mockFetch.mockResolvedValueOnce(respond({ orderNumber: 'WL-104233', href: '/checkout/confirmation/WL-104233' }, 201));
    const { result, context } = setup();
    fill(result);

    await submit(result);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/checkout');
    expect(init.method).toBe('POST');
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      idempotencyKey: KEY,
      shippingMethod: 'standard',
      card: { number: '4242424242424242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' },
      expected: { total: 79.98, lines: [{ productDocumentId: 's1', sizeKey: 'M', quantity: 2, unitPrice: 39.99 }] },
    });

    expect(result.current.placed).toBe(true);
    expect(router.push).toHaveBeenCalledWith('/checkout/confirmation/WL-104233');
    expect(context.reload).toHaveBeenCalled();
    expect(sessionStorage.getItem('westline_checkout')).toBeNull();
    expect(sessionStorage.getItem('westline_checkout_key')).not.toBe(KEY);
  });

  it('treats a replayed order (200) as placed too', async () => {
    mockFetch.mockResolvedValueOnce(respond({ orderNumber: 'WL-104233', href: '/checkout/confirmation/WL-104233' }, 200));
    const { result } = setup();
    fill(result);
    await submit(result);
    expect(router.push).toHaveBeenCalledWith('/checkout/confirmation/WL-104233');
  });

  it('sends one request for a double submit', async () => {
    let resolve!: (response: Response) => void;
    mockFetch.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    const { result } = setup();
    fill(result);

    let first!: Promise<void>;
    act(() => {
      first = result.current.submit({ preventDefault() {} } as never);
    });
    expect(result.current.submitting).toBe(true);
    await act(async () => {
      await result.current.submit({ preventDefault() {} } as never);
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolve(respond({ orderNumber: 'WL-1', href: '/checkout/confirmation/WL-1' }, 201));
      await first;
    });
    expect(result.current.submitting).toBe(false);
  });

  it.each([
    [402, { error: { code: 'card-declined' } }, 'Your card was declined. Try another card.'],
    [502, { error: { code: 'payment-error' } }, "We couldn't process your payment. Try again."],
    [429, { error: { code: 'rate-limited' } }, 'Too many attempts. Wait a minute and try again.'],
    [503, { error: { code: 'unavailable' } }, "We couldn't place your order. Check your connection and try again."],
  ])('shows the %i message, keeps every field and the attempt key', async (status, body, message) => {
    mockFetch.mockResolvedValueOnce(respond(body, status));
    const { result } = setup();
    fill(result);

    await submit(result);

    expect(result.current.alert).toBe(message);
    expect(result.current.values).toMatchObject(FILLED_FORM);
    expect(result.current.placed).toBe(false);
    expect(sessionStorage.getItem('westline_checkout_key')).toBe(KEY);
    expect(router.push).not.toHaveBeenCalled();
  });

  it('shows a network failure as a retryable error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const { result } = setup();
    fill(result);
    await submit(result);
    expect(result.current.alert).toBe("We couldn't place your order. Check your connection and try again.");
    expect(result.current.submitting).toBe(false);
  });

  it('reloads the cart and marks the changed lines when the cart changed', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'cart-changed', lineKeys: ['s1:M'] } }, 409));
    const { result, context } = setup();
    fill(result);

    await submit(result);

    expect(context.reload).toHaveBeenCalled();
    expect(result.current.alert).toBe('Your cart changed — review it and place your order again.');
    expect(Array.from(result.current.changedKeys)).toEqual(['s1:M']);
  });

  it('reloads an emptied cart', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'cart-empty' } }, 409));
    const { result, context } = setup();
    fill(result);
    await submit(result);
    expect(context.reload).toHaveBeenCalled();
    expect(result.current.alert).toBe('Your cart is empty.');
  });

  it('maps server field errors to the form and focuses the first', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'bad-request', fields: { postalCode: 'Enter a 5-digit ZIP code.' } } }, 400));
    const { result } = setup();
    const focus = vi.fn();
    act(() => result.current.fieldRef('postalCode')({ focus } as never));
    fill(result);

    await submit(result);

    expect(result.current.errors).toEqual({ postalCode: 'Enter a 5-digit ZIP code.' });
    expect(focus).toHaveBeenCalled();
  });

  it('sends an expired session to sign-in, returning to checkout', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'unauthorized' } }, 401));
    const { result } = setup();
    fill(result);
    await submit(result);
    expect(router.push).toHaveBeenCalledWith('/auth/login?next=%2Fcheckout');
  });

  it('focuses the alert when it appears', async () => {
    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'card-declined' } }, 402));
    const { result } = setup();
    const focus = vi.fn();
    (result.current.alertRef as { current: unknown }).current = { focus };
    fill(result);
    await submit(result);
    await waitFor(() => expect(focus).toHaveBeenCalled());
  });
});
