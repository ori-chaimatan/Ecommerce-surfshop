// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getOrder, placeOrder, type StrapiOrder } from '@/lib/strapi/orders';

const mockFetch = vi.fn();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const lastCall = () => mockFetch.mock.calls.at(-1) as [string, RequestInit];

export const ORDER: StrapiOrder = {
  orderNumber: 'WL-104233',
  status: 'processing',
  email: 'jamie@example.com',
  placedAt: '2026-10-11T12:00:00.000Z',
  shippingMethod: 'standard',
  shippingAddress: {
    firstName: 'Jamie',
    lastName: 'Rivera',
    address1: '1 Ocean Ave',
    address2: null,
    city: 'Santa Cruz',
    state: 'CA',
    postalCode: '95060',
    country: 'US',
    phone: null,
  },
  lines: [
    { productDocumentId: 'p1', name: 'CI Pro', slug: 'ci-pro', sizeKey: '6-0-29.9', sizeLabel: `6'0" · 29.9L`, unitPrice: 600, quantity: 1, lineTotal: 600, imageUrl: '/uploads/ci.png', imageAlt: null },
  ],
  subtotal: 600,
  shippingCost: 0,
  total: 600,
  currency: 'USD',
  payment: { brand: 'visa', last4: '4242' },
};

const BODY = { idempotencyKey: 'k' } as never;

describe('lib/strapi/orders (checkout AC3, AC8, AC21)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('placeOrder POSTs /api/orders with the Bearer JWT, uncached', async () => {
    mockFetch.mockResolvedValueOnce(json({ order: ORDER }, 201));

    await expect(placeOrder('jwt-1', BODY)).resolves.toEqual({ ok: true, status: 201, order: ORDER });

    const [url, init] = lastCall();
    expect(url).toMatch(/\/api\/orders$/);
    expect(init.method).toBe('POST');
    expect(init.cache).toBe('no-store');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
    expect(JSON.parse(init.body as string)).toEqual(BODY);
  });

  it('passes a replay through as 200', async () => {
    mockFetch.mockResolvedValueOnce(json({ order: ORDER }, 200));
    await expect(placeOrder('jwt-1', BODY)).resolves.toMatchObject({ ok: true, status: 200 });
  });

  it.each([
    [400, { code: 'bad-request', message: 'Check the highlighted fields.', fields: { postalCode: 'Enter a 5-digit ZIP code.' } }],
    [402, { code: 'card-declined', message: 'Your card was declined. Try another card.' }],
    [409, { code: 'cart-changed', message: 'changed', lineKeys: ['p1:M'] }],
    [502, { code: 'payment-error', message: 'error' }],
    [401, { code: 'unauthorized', message: 'Sign in to continue.' }],
  ])('returns the %i error with its code and details, without logging it', async (status, error) => {
    mockFetch.mockResolvedValueOnce(json({ error }, status));

    await expect(placeOrder('jwt-1', BODY)).resolves.toEqual({ ok: false, status, ...error });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('maps Strapi being down to 503', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(placeOrder('jwt-1', BODY)).resolves.toMatchObject({ ok: false, status: 503, code: null });
  });

  it('treats an unexpected success shape as a 502', async () => {
    mockFetch.mockResolvedValueOnce(json({ nope: true }, 201));
    await expect(placeOrder('jwt-1', BODY)).resolves.toMatchObject({ ok: false, status: 502 });
  });

  it('getOrder reads one order by number, encoded', async () => {
    mockFetch.mockResolvedValueOnce(json({ order: ORDER }));

    await expect(getOrder('jwt-1', 'WL-104233')).resolves.toEqual({ ok: true, order: ORDER });
    const [url, init] = lastCall();
    expect(url).toMatch(/\/api\/orders\/WL-104233$/);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
  });

  it('getOrder reports not found and unauthorized by status', async () => {
    mockFetch.mockResolvedValueOnce(json({ error: { code: 'not-found' } }, 404));
    await expect(getOrder('jwt-1', 'WL-000000')).resolves.toEqual({ ok: false, status: 404 });

    mockFetch.mockResolvedValueOnce(json({ error: { code: 'unauthorized' } }, 401));
    await expect(getOrder('jwt-1', 'WL-000000')).resolves.toEqual({ ok: false, status: 401 });
    expect(console.error).not.toHaveBeenCalled();
  });

  it('getOrder encodes an odd order number into one path segment', async () => {
    mockFetch.mockResolvedValueOnce(json({ error: { code: 'not-found' } }, 404));
    await getOrder('jwt-1', '../users/me');
    expect(lastCall()[0]).toMatch(/\/api\/orders\/\.\.%2Fusers%2Fme$/);
  });
});
