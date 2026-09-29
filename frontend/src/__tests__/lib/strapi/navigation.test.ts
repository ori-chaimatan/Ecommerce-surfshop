// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNavigationCategories } from '@/lib/strapi/navigation';

const mockFetch = vi.fn();

function strapiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

const CATEGORIES = [
  {
    id: 1,
    Name: 'Surfboards',
    Slug: 'surfboards',
    Subcategories: [{ id: 1, Name: 'Longboard', Slug: 'longboard', NavLabel: null }],
  },
  {
    id: 2,
    Name: 'Wetsuits',
    Slug: 'wetsuits',
    Subcategories: [{ id: 2, Name: "Men's Wetsuits", Slug: 'mens-wetsuits', NavLabel: 'Men' }],
  },
];

describe('getNavigationCategories', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches categories with their subcategories (incl. NavLabel), both in Strapi id order, revalidating every 60s (AC1)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: CATEGORIES }));

    await getNavigationCategories();

    const [url, init] = mockFetch.mock.calls[0];
    const decoded = decodeURIComponent(url);
    expect(url).toContain('http://localhost:1337/api/categories?');
    expect(decoded).toContain('fields[0]=Name');
    expect(decoded).toContain('fields[1]=Slug');
    expect(decoded).toContain('sort[0]=id:asc');
    expect(decoded).toContain('populate[Subcategories][fields][2]=NavLabel');
    expect(decoded).toContain('populate[Subcategories][sort][0]=id:asc');
    expect(init).toEqual(expect.objectContaining({ next: { revalidate: 60 } }));
  });

  it('returns the categories with their subcategories (AC1)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: CATEGORIES }));

    await expect(getNavigationCategories()).resolves.toEqual([
      { Name: 'Surfboards', Slug: 'surfboards', Subcategories: [{ Name: 'Longboard', Slug: 'longboard', NavLabel: null }] },
      { Name: 'Wetsuits', Slug: 'wetsuits', Subcategories: [{ Name: "Men's Wetsuits", Slug: 'mens-wetsuits', NavLabel: 'Men' }] },
    ]);
  });

  it('returns [] when Strapi is unreachable (AC11)', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));

    await expect(getNavigationCategories()).resolves.toEqual([]);
  });

  it('returns [] on a non-2xx response (AC11)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ error: { status: 500 } }, 500));

    await expect(getNavigationCategories()).resolves.toEqual([]);
  });

  it('returns [] on malformed data (AC11)', async () => {
    mockFetch.mockResolvedValue(strapiResponse({ data: 'nope' }));

    await expect(getNavigationCategories()).resolves.toEqual([]);
  });
});
