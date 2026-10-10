// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRAPI_URL, strapiFetch, strapiRequest } from '@/lib/strapi/client';

const mockFetch = vi.fn();
let consoleError: ReturnType<typeof vi.spyOn>;

describe('strapiFetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('GETs /api/<path> on STRAPI_URL with a 60s revalidate by default and returns the JSON', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: [1] }), { status: 200 }));

    await expect(strapiFetch('categories?x=1', { label: 't', fallback: null })).resolves.toEqual({ data: [1] });
    expect(STRAPI_URL).toBe('http://localhost:1337');
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:1337/api/categories?x=1', { next: { revalidate: 60 } });
  });

  it('passes a custom revalidate through', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await strapiFetch('homepage', { label: 't', fallback: null, revalidate: 5 });
    expect(mockFetch).toHaveBeenCalledWith(expect.any(String), { next: { revalidate: 5 } });
  });

  it('logs and returns the fallback on a non-2xx response', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 500 }));

    await expect(strapiFetch('x', { label: 'nav', fallback: 'FB' })).resolves.toBe('FB');
    expect(consoleError).toHaveBeenCalledWith('[nav] Strapi responded 500');
  });

  it('returns the fallback without logging for a silent status', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 404 }));

    await expect(strapiFetch('x', { label: 'home', fallback: 'FB', silentStatuses: [404] })).resolves.toBe('FB');
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('logs and returns the fallback on a network error or unparsable body', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    await expect(strapiFetch('x', { label: 'nav', fallback: [] })).resolves.toEqual([]);

    mockFetch.mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(strapiFetch('x', { label: 'nav', fallback: [] })).resolves.toEqual([]);
    expect(consoleError).toHaveBeenCalledTimes(2);
  });
});

describe('strapiRequest (add-to-cart AC6)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('sends method, JSON body and headers uncached, and returns ok/status/data', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ lines: [] }), { status: 200 }));

    await expect(
      strapiRequest('carts/current/lines', { label: 'cart', method: 'POST', body: { a: 1 }, headers: { 'x-cart-token': 't' } })
    ).resolves.toEqual({ ok: true, status: 200, data: { lines: [] } });
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:1337/api/carts/current/lines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-cart-token': 't' },
      body: '{"a":1}',
      cache: 'no-store',
    });
  });

  it('GETs without a body or content type by default', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 200 }));

    await strapiRequest('carts/current', { label: 'cart' });
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:1337/api/carts/current', {
      method: 'GET',
      headers: {},
      body: undefined,
      cache: 'no-store',
    });
  });

  it('returns non-2xx responses with their body, logging only statuses not marked silent', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ error: { code: 'sold-out' } }), { status: 409 }));
    await expect(strapiRequest('x', { label: 'cart', silentStatuses: [409] })).resolves.toEqual({
      ok: false,
      status: 409,
      data: { error: { code: 'sold-out' } },
    });
    expect(consoleError).not.toHaveBeenCalled();

    mockFetch.mockResolvedValue(new Response('{}', { status: 500 }));
    await strapiRequest('x', { label: 'cart' });
    expect(consoleError).toHaveBeenCalledWith('[cart] Strapi responded 500');
  });

  it('never throws: a network error is status 0 and an unparsable body is null data', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    await expect(strapiRequest('x', { label: 'cart' })).resolves.toEqual({ ok: false, status: 0, data: null });

    mockFetch.mockResolvedValue(new Response('<html>', { status: 200 }));
    await expect(strapiRequest('x', { label: 'cart' })).resolves.toEqual({ ok: true, status: 200, data: null });
  });
});
