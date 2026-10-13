// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DELETE, PATCH, POST } from '@/app/api/cart/lines/route';
import { STRAPI_CART, strapiJson } from '../cart-fixtures';

const mockFetch = vi.fn();

function request(method: string, body: unknown, cookie?: string) {
  return new NextRequest('http://localhost/api/cart/lines', {
    method,
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: cookie ? { cookie } : {},
  });
}

const lastCall = () => mockFetch.mock.calls.at(-1) as [string, RequestInit];

describe('/api/cart/lines (AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POST adds a line and sets the new guest token as the westline_cart cookie', async () => {
    mockFetch.mockResolvedValue(strapiJson({ ...STRAPI_CART, token: 'new-token' }));

    const response = await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }));

    expect(lastCall()[0]).toBe('http://localhost:1337/api/carts/current/lines');
    expect(lastCall()[1]).toMatchObject({ method: 'POST', body: '{"productDocumentId":"s1","sizeKey":"M"}' });
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    const cookie = response.cookies.get('westline_cart');
    expect(cookie).toMatchObject({ value: 'new-token', httpOnly: true, sameSite: 'lax', path: '/', maxAge: 2592000 });
    expect(await response.json()).toMatchObject({ count: 2 });
  });

  it('POST sets no cookie when the cart already existed', async () => {
    mockFetch.mockResolvedValue(strapiJson(STRAPI_CART));

    const response = await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }, 'westline_cart=t'));
    expect(lastCall()[1]).toMatchObject({ headers: { 'Content-Type': 'application/json', 'x-cart-token': 't' } });
    expect(response.cookies.get('westline_cart')).toBeUndefined();
  });

  it('PATCH sets a quantity', async () => {
    mockFetch.mockResolvedValue(strapiJson(STRAPI_CART));

    const response = await PATCH(request('PATCH', { productDocumentId: 's1', sizeKey: 'M', quantity: 2 }, 'westline_cart=t'));
    expect(lastCall()[1]).toMatchObject({ method: 'PATCH', body: '{"productDocumentId":"s1","sizeKey":"M","quantity":2}' });
    expect(response.status).toBe(200);
  });

  it('DELETE removes a line by its product and size key', async () => {
    mockFetch.mockResolvedValue(strapiJson({ lines: [], removedCount: 0 }));

    const response = await DELETE(request('DELETE', { productDocumentId: 's1', sizeKey: '6-0-29.9' }, 'westline_cart=t'));
    expect(lastCall()[0]).toBe('http://localhost:1337/api/carts/current/lines/s1/6-0-29.9');
    expect(lastCall()[1]).toMatchObject({ method: 'DELETE' });
    expect(await response.json()).toMatchObject({ isEmpty: true });
  });

  it.each([
    ['POST', 'not json'],
    ['POST', {}],
    ['POST', { productDocumentId: 's1' }],
    ['POST', { productDocumentId: 's1', sizeKey: 'x'.repeat(33) }],
    ['PATCH', { productDocumentId: 's1', sizeKey: 'M' }],
    ['PATCH', { productDocumentId: 's1', sizeKey: 'M', quantity: 0 }],
    ['PATCH', { productDocumentId: 's1', sizeKey: 'M', quantity: 100 }],
    ['PATCH', { productDocumentId: 's1', sizeKey: 'M', quantity: 1.5 }],
    ['DELETE', { sizeKey: 'M' }],
  ])('%s with %j → 400 without calling Strapi', async (method, body) => {
    const handler = { POST, PATCH, DELETE }[method as 'POST' | 'PATCH' | 'DELETE'];

    const response = await handler(request(method, body));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'bad-request' } });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('passes 409 and 404 through with their code', async () => {
    mockFetch.mockResolvedValue(strapiJson({ error: { code: 'sold-out' } }, 409));
    let response = await POST(request('POST', { productDocumentId: 's1', sizeKey: 'XL' }));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: { code: 'sold-out' } });

    mockFetch.mockResolvedValue(strapiJson({ error: { code: 'not-found' } }, 404));
    response = await POST(request('POST', { productDocumentId: 'gone', sizeKey: 'M' }));
    expect(response.status).toBe(404);
  });

  it('returns 503 when Strapi is down or answers with a server error', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    expect((await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }))).status).toBe(503);

    mockFetch.mockResolvedValue(strapiJson({}, 500));
    expect((await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }))).status).toBe(503);
  });
});

describe('/api/cart/lines with an expired or invalid session (add-to-cart AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('POST adds to a new guest cart instead, setting westline_cart and clearing westline_session', async () => {
    mockFetch
      .mockResolvedValueOnce(strapiJson({ error: { code: 'unauthorized' } }, 401))
      .mockResolvedValueOnce(strapiJson({ ...STRAPI_CART, token: 'guest-token' }));

    const response = await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }, 'westline_session=garbage'));

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1].headers).toEqual({ 'Content-Type': 'application/json' });
    expect(response.cookies.get('westline_cart')?.value).toBe('guest-token');
    expect(response.cookies.get('westline_session')?.maxAge).toBe(0);
    expect(response.headers.get('x-westline-session')).toBe('expired');
  });

  it.each(['PATCH', 'DELETE'] as const)('%s also falls back to the guest cart', async (method) => {
    mockFetch
      .mockResolvedValueOnce(strapiJson({ error: { code: 'unauthorized' } }, 401))
      .mockResolvedValueOnce(strapiJson(STRAPI_CART));
    const handler = { PATCH, DELETE }[method];

    const response = await handler(
      request(method, { productDocumentId: 's1', sizeKey: 'M', quantity: 2 }, 'westline_session=expired; westline_cart=t')
    );
    expect(response.status).toBe(200);
    expect(mockFetch.mock.calls[1][1]).toMatchObject({ headers: { 'x-cart-token': 't' } });
    expect(response.cookies.get('westline_session')?.maxAge).toBe(0);
  });

  it('a 401 without a session is passed through', async () => {
    mockFetch.mockResolvedValue(strapiJson({ error: { code: 'unauthorized' } }, 401));

    const response = await POST(request('POST', { productDocumentId: 's1', sizeKey: 'M' }));
    expect(response.status).toBe(401);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
