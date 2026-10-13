// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from '@/app/api/cart/route';
import { STRAPI_CART, strapiJson } from './cart-fixtures';

const mockFetch = vi.fn();

const request = (cookie?: string) => new NextRequest('http://localhost/api/cart', { headers: cookie ? { cookie } : {} });

describe('GET /api/cart (AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('forwards the session and guest cookies as identity headers and returns the cart view, uncached', async () => {
    mockFetch.mockResolvedValue(strapiJson(STRAPI_CART));

    const response = await GET(request('westline_session=j; westline_cart=t'));

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:1337/api/carts/current',
      expect.objectContaining({ headers: { Authorization: 'Bearer j', 'x-cart-token': 't' } })
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const body = await response.json();
    expect(body).toMatchObject({ count: 2, subtotal: '$158', lines: [{ key: 's1:M', sizeLabel: 'M' }] });
  });

  it('returns 503 when Strapi is down', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));

    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: { code: null } });
  });
});

describe('GET /api/cart with an expired or invalid session (add-to-cart AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('retries as a guest, clears westline_session and flags the expired session', async () => {
    mockFetch
      .mockResolvedValueOnce(strapiJson({ error: { code: 'unauthorized' } }, 401))
      .mockResolvedValueOnce(strapiJson(STRAPI_CART));

    const response = await GET(request('westline_session=expired.jwt; westline_cart=t'));

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ headers: { 'x-cart-token': 't' } });
    expect(mockFetch.mock.calls[1][1].headers).not.toHaveProperty('Authorization');
    const cleared = response.cookies.get('westline_session');
    expect(cleared?.value).toBe('');
    expect(cleared?.maxAge).toBe(0);
    expect(response.headers.get('x-westline-session')).toBe('expired');
    expect(await response.json()).toMatchObject({ count: 2 });
  });

  it('leaves a valid session alone', async () => {
    mockFetch.mockResolvedValue(strapiJson(STRAPI_CART));

    const response = await GET(request('westline_session=good.jwt'));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(response.cookies.get('westline_session')).toBeUndefined();
    expect(response.headers.get('x-westline-session')).toBeNull();
  });
});
