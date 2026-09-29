// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { STRAPI_URL, strapiFetch } from '@/lib/strapi/client';

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
