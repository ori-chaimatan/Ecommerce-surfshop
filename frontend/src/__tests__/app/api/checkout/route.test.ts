// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { POST } from '@/app/api/checkout/route';
import { STRAPI_CART, strapiJson } from '../cart/cart-fixtures';

const mockFetch = vi.fn();
const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';
const ORDER = {
  orderNumber: 'WL-104233',
  status: 'processing',
  email: 'jamie@example.com',
  placedAt: '2026-10-11T12:00:00.000Z',
  shippingMethod: 'standard',
  shippingAddress: { firstName: 'J', lastName: 'R', address1: 'a', address2: null, city: 'c', state: 'CA', postalCode: '95060', country: 'US', phone: null },
  lines: [],
  subtotal: 158,
  shippingCost: 0,
  total: 158,
  currency: 'USD',
  payment: { brand: 'visa', last4: '4242' },
};

const BODY = {
  idempotencyKey: KEY,
  shipping: { firstName: 'Jamie', lastName: 'Rivera', address1: '1 Ocean Ave', address2: '', city: 'Santa Cruz', state: 'CA', postalCode: '95060', phone: '' },
  shippingMethod: 'standard',
  card: { number: '4242424242424242', expMonth: 12, expYear: 2099 - 70, cvc: '123', name: 'Jamie Rivera' },
  expected: { total: 158, lines: [{ productDocumentId: 's1', sizeKey: 'M', quantity: 2, unitPrice: 79 }] },
};

let ip = 0;
function request(body: unknown, { session = true, forwardedFor }: { session?: boolean; forwardedFor?: string } = {}) {
  ip += 1;
  return new NextRequest('http://localhost/api/checkout', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: {
      ...(session ? { cookie: 'westline_session=jwt-1' } : {}),
      'x-forwarded-for': forwardedFor ?? `10.0.0.${ip}`,
    },
  });
}

const call = (n: number) => mockFetch.mock.calls[n] as [string, RequestInit];

describe('POST /api/checkout (checkout AC3, AC12, AC20, AC21)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requires a session', async () => {
    const response = await POST(request(BODY, { session: false }));
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: { code: 'unauthorized' } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects an invalid body with field errors, without calling Strapi', async () => {
    const response = await POST(request({ ...BODY, shipping: { ...BODY.shipping, postalCode: '12' } }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'bad-request', fields: { postalCode: 'Enter a 5-digit ZIP code.' } } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('rejects unparsable JSON', async () => {
    const response = await POST(request('{nope'));
    expect(response.status).toBe(400);
  });

  it('places the order as the session user and returns its number and confirmation URL', async () => {
    mockFetch.mockResolvedValueOnce(strapiJson({ order: ORDER }, 201));

    const response = await POST(request(BODY));

    expect(call(0)[0]).toBe('http://localhost:1337/api/orders');
    expect(call(0)[1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer jwt-1' } });
    expect(response.status).toBe(201);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ orderNumber: 'WL-104233', href: '/checkout/confirmation/WL-104233' });
  });

  it('passes a replay through as 200 with the same order', async () => {
    mockFetch.mockResolvedValueOnce(strapiJson({ order: ORDER }, 200));
    const response = await POST(request(BODY));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ orderNumber: 'WL-104233', href: '/checkout/confirmation/WL-104233' });
  });

  it.each([
    [402, 'card-declined', 402],
    [502, 'payment-error', 502],
    [409, 'cart-empty', 409],
  ])('passes Strapi %i %s through as %i', async (strapiStatus, code, status) => {
    mockFetch.mockResolvedValueOnce(strapiJson({ error: { code, message: 'm' } }, strapiStatus));
    const response = await POST(request(BODY));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code, message: 'm' } });
  });

  it('returns the reloaded cart with cart-changed', async () => {
    mockFetch
      .mockResolvedValueOnce(strapiJson({ error: { code: 'cart-changed', message: 'changed', lineKeys: ['s1:M'] } }, 409))
      .mockResolvedValueOnce(strapiJson({ ...STRAPI_CART, lines: [{ ...STRAPI_CART.lines[0], price: 89 }] }));

    const response = await POST(request(BODY));

    expect(response.status).toBe(409);
    expect(call(1)[0]).toBe('http://localhost:1337/api/carts/current');
    const json = await response.json();
    expect(json.error).toEqual({ code: 'cart-changed', message: 'changed', lineKeys: ['s1:M'] });
    expect(json.cart).toMatchObject({ subtotal: '$178', lines: [{ key: 's1:M', unitAmount: 89 }] });
  });

  it('maps server field errors back to the form', async () => {
    mockFetch.mockResolvedValueOnce(strapiJson({ error: { code: 'bad-request', message: 'm', fields: { cardNumber: 'x' } } }, 400));
    const response = await POST(request(BODY));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'bad-request', message: 'm', fields: { cardNumber: 'x' } } });
  });

  it('clears a session Strapi rejects and flags it', async () => {
    mockFetch.mockResolvedValueOnce(strapiJson({ error: { code: 'unauthorized' } }, 401));
    const response = await POST(request(BODY));
    expect(response.status).toBe(401);
    expect(response.cookies.get('westline_session')?.value).toBe('');
    expect(response.headers.get('x-westline-session')).toBe('expired');
  });

  it('answers 503 when Strapi is down', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    const response = await POST(request(BODY));
    expect(response.status).toBe(503);
  });

  it('limits a shopper to 10 attempts a minute', async () => {
    mockFetch.mockImplementation(async () => strapiJson({ error: { code: 'card-declined', message: 'm' } }, 402));
    const statuses: number[] = [];
    for (let i = 0; i < 11; i += 1) statuses.push((await POST(request(BODY, { forwardedFor: '203.0.113.9' }))).status);

    expect(statuses.slice(0, 10).every((s) => s === 402)).toBe(true);
    const limited = await POST(request(BODY, { forwardedFor: '203.0.113.9' }));
    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect(await limited.json()).toEqual({ error: { code: 'rate-limited' } });
  });

  it('never logs card data', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await POST(request(BODY));
    const logged = JSON.stringify([...vi.mocked(console.error).mock.calls, ...vi.mocked(console.log).mock.calls, ...vi.mocked(console.warn).mock.calls]);
    expect(logged).not.toContain('4242424242424242');
    expect(logged).not.toContain('"123"');
  });
});
