// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addCartLine,
  getCart,
  mergeGuestCart,
  removeCartLine,
  setCartLineQty,
  type StrapiCart,
} from '@/lib/strapi/cart';

const mockFetch = vi.fn();

const CART: StrapiCart = {
  removedCount: 0,
  lines: [
    {
      productDocumentId: 'p1',
      slug: 'ci-pro',
      name: 'CI Pro',
      price: 600,
      sizeType: 'Surfboard',
      sizeKey: '6-0-29.9',
      size: { LengthFt: 6, LengthInches: 0, VolumeL: 29.9 },
      quantity: 1,
      stock: 4,
      image: { url: '/uploads/ci.png', width: 800, height: 1000, alternativeText: null },
      soldOut: false,
      unavailable: false,
      adjusted: false,
    },
  ],
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const lastCall = () => mockFetch.mock.calls.at(-1) as [string, RequestInit];

describe('lib/strapi/cart (AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('getCart sends the JWT as Bearer and the guest token as x-cart-token', async () => {
    mockFetch.mockResolvedValue(json(CART));

    await expect(getCart({ jwt: 'j', token: 't' })).resolves.toEqual({ ok: true, cart: CART });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:1337/api/carts/current');
    expect(init).toMatchObject({ method: 'GET', headers: { Authorization: 'Bearer j', 'x-cart-token': 't' }, cache: 'no-store' });
  });

  it('omits identity headers that are absent', async () => {
    mockFetch.mockResolvedValue(json(CART));

    await getCart({ jwt: null, token: null });
    expect(lastCall()[1].headers).toEqual({});
  });

  it('addCartLine POSTs the product and size key', async () => {
    mockFetch.mockResolvedValue(json({ ...CART, token: 'new' }));

    await expect(addCartLine({ token: null, jwt: null }, { productDocumentId: 'p1', sizeKey: 'M' })).resolves.toEqual({
      ok: true,
      cart: { ...CART, token: 'new' },
    });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:1337/api/carts/current/lines');
    expect(init).toMatchObject({ method: 'POST', body: '{"productDocumentId":"p1","sizeKey":"M"}' });
  });

  it('setCartLineQty PATCHes the quantity', async () => {
    mockFetch.mockResolvedValue(json(CART));

    await setCartLineQty({ token: 't' }, { productDocumentId: 'p1', sizeKey: 'M', quantity: 3 });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:1337/api/carts/current/lines');
    expect(init).toMatchObject({ method: 'PATCH', body: '{"productDocumentId":"p1","sizeKey":"M","quantity":3}' });
  });

  it('removeCartLine DELETEs the line by path, encoding the size key', async () => {
    mockFetch.mockResolvedValue(json(CART));

    await removeCartLine({ token: 't' }, { productDocumentId: 'p1', sizeKey: '6-0-29.9' });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:1337/api/carts/current/lines/p1/6-0-29.9');
    expect(init.method).toBe('DELETE');

    await removeCartLine({ token: 't' }, { productDocumentId: 'p/1', sizeKey: 'a b' });
    expect(lastCall()[0]).toBe('http://localhost:1337/api/carts/current/lines/p%2F1/a%20b');
  });

  it('mergeGuestCart POSTs to /carts/merge with both identities', async () => {
    mockFetch.mockResolvedValue(json(CART));

    await expect(mergeGuestCart('j', 't')).resolves.toEqual({ ok: true, cart: CART });
    const [url, init] = lastCall();
    expect(url).toBe('http://localhost:1337/api/carts/merge');
    expect(init).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer j', 'x-cart-token': 't' } });
  });

  it('passes error statuses and codes through', async () => {
    mockFetch.mockResolvedValue(json({ error: { code: 'sold-out', message: 'x' } }, 409));
    await expect(addCartLine({}, { productDocumentId: 'p1', sizeKey: 'M' })).resolves.toEqual({
      ok: false,
      status: 409,
      code: 'sold-out',
    });

    mockFetch.mockResolvedValue(json({}, 404));
    await expect(getCart({})).resolves.toEqual({ ok: false, status: 404, code: null });
  });

  it('maps a network failure to 503 and a malformed body to 502', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    await expect(getCart({})).resolves.toEqual({ ok: false, status: 503, code: null });

    mockFetch.mockResolvedValue(json({ lines: 'nope' }));
    await expect(getCart({})).resolves.toEqual({ ok: false, status: 502, code: null });

    mockFetch.mockResolvedValue(json({ lines: [{ name: 'x' }], removedCount: 0 }));
    await expect(getCart({})).resolves.toEqual({ ok: false, status: 502, code: null });
  });
});
