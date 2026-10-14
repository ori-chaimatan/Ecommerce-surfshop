// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProductBySlug } from '@/lib/strapi/product';

const mockFetch = vi.fn();

function strapiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const tideline = {
  id: 1,
  Name: 'Tideline 6\'0" Performance Shortboard',
  Slug: 'tideline',
  Price: 829,
  Description: 'Fast and loose.',
  SizeType: 'Surfboard',
  Images: [{ url: '/uploads/tideline.jpg', width: 800, height: 1600 }],
  Category: { Name: 'Surfboards', Slug: 'surfboards' },
  BoardSizes: [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 5 }],
  SurfboardSpecs: null,
};

function requestedUrl() {
  return decodeURIComponent(mockFetch.mock.calls[0][0]);
}

describe('getProductBySlug', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('requests one product by slug with the detail fields and populates, revalidating every 60s (AC2)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: [tideline] }));

    await getProductBySlug('tideline');

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('http://localhost:1337/api/products?');
    const decoded = requestedUrl();
    expect(decoded).toContain('filters[Slug][$eq]=tideline');
    expect(decoded).toContain('fields[0]=Name');
    expect(decoded).toContain('fields[1]=Slug');
    expect(decoded).toContain('fields[2]=Price');
    expect(decoded).toContain('fields[3]=Description');
    expect(decoded).toContain('fields[4]=SizeType');
    expect(decoded).toContain('populate[Images][fields][0]=url');
    expect(decoded).toContain('populate[Images][fields][1]=width');
    expect(decoded).toContain('populate[Images][fields][2]=height');
    expect(decoded).toContain('populate[Category][fields][0]=Name');
    expect(decoded).toContain('populate[Category][fields][1]=Slug');
    expect(decoded).toContain('populate[BoardSizes]=true');
    expect(decoded).toContain('populate[SurfboardSpecs][populate][Video][fields][0]=url');
    expect(decoded).toContain('populate[SurfboardSpecs][populate][Video][fields][1]=mime');
    expect(decoded).toContain('pagination[pageSize]=1');
    expect(init).toEqual(expect.objectContaining({ next: { revalidate: 60 } }));
  });

  it('also requests Gender and StandardSizes for standard products (standard-product-detail-page AC2)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: [] }));

    await getProductBySlug('samurai');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const decoded = requestedUrl();
    expect(decoded).toContain('fields[5]=Gender');
    expect(decoded).toContain('populate[StandardSizes]=true');
  });

  it('passes a standard product through with its sizes and gender', async () => {
    const samurai = {
      ...tideline,
      Name: 'Samurai Pro 22" Boardshort',
      Slug: 'samurai',
      SizeType: 'Standard',
      Gender: 'Men',
      Category: { Name: 'Clothing', Slug: 'clothing' },
      BoardSizes: [],
      StandardSizes: [{ Size: 'M', Stock: 24 }],
    };
    mockFetch.mockResolvedValue(strapiResponse({ data: [samurai] }));

    await expect(getProductBySlug('samurai')).resolves.toEqual({ kind: 'ok', product: samurai });
  });

  it('encodes the slug so it cannot inject extra query params', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: [] }));

    await getProductBySlug('a&filters[Slug][$ne]=x');

    const raw = mockFetch.mock.calls[0][0] as string;
    expect(new URL(raw).searchParams.get('filters[Slug][$eq]')).toBe('a&filters[Slug][$ne]=x');
  });

  it('returns the raw product when found', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: [tideline] }));

    await expect(getProductBySlug('tideline')).resolves.toEqual({ kind: 'ok', product: tideline });
  });

  it('returns not-found when no product has the slug (AC3)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: [] }));

    await expect(getProductBySlug('nope')).resolves.toEqual({ kind: 'not-found' });
  });

  it('returns unavailable on a network error (AC4)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));

    await expect(getProductBySlug('tideline')).resolves.toEqual({ kind: 'unavailable' });
  });

  it('returns unavailable on a non-2xx response (AC4)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ error: 'boom' }, 500));

    await expect(getProductBySlug('tideline')).resolves.toEqual({ kind: 'unavailable' });
  });

  it('returns unavailable on a malformed body (AC4)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: { id: 1 } }));

    await expect(getProductBySlug('tideline')).resolves.toEqual({ kind: 'unavailable' });
  });
});
