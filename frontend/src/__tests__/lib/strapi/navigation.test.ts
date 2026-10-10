// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getNavigation, getNavigationCategories, getSubcategoryGenders } from '@/lib/strapi/navigation';

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

function genderPage(data: unknown[], page = 1, pageCount = 1) {
  return strapiResponse({ data, meta: { pagination: { page, pageCount } } });
}

describe('getSubcategoryGenders', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('fetches only Gender + Subcategory slugs of Clothing products, no media, revalidating every 60s (AC3)', async () => {
    mockFetch.mockResolvedValue(genderPage([]));

    await getSubcategoryGenders();

    const [url, init] = mockFetch.mock.calls[0];
    const decoded = decodeURIComponent(url);
    expect(url).toContain('http://localhost:1337/api/products?');
    expect(decoded).toContain('fields[0]=Gender');
    expect(decoded).toContain('populate[Subcategories][fields][0]=Slug');
    expect(decoded).toContain('filters[Category][Slug][$in][0]=clothing');
    expect(decoded).not.toMatch(/Images|populate=\*/);
    expect(init).toEqual(expect.objectContaining({ next: { revalidate: 60 } }));
  });

  it('maps each subcategory slug to the distinct Genders of its products (AC3)', async () => {
    mockFetch.mockResolvedValue(
      genderPage([
        { Gender: 'Men', Subcategories: [{ Slug: 'shorts' }, { Slug: 'boardshorts' }] },
        { Gender: 'Women', Subcategories: [{ Slug: 'shorts' }] },
        { Gender: 'Men', Subcategories: [{ Slug: 'shorts' }] },
        { Gender: 'Unisex', Subcategories: [{ Slug: 'tshirts-tanks' }] },
        { Gender: null, Subcategories: [{ Slug: 'tops' }] },
      ])
    );

    await expect(getSubcategoryGenders()).resolves.toEqual({
      shorts: ['Men', 'Women'],
      boardshorts: ['Men'],
      'tshirts-tanks': ['Unisex'],
    });
  });

  it('follows every page of products (AC3)', async () => {
    mockFetch
      .mockResolvedValueOnce(genderPage([{ Gender: 'Men', Subcategories: [{ Slug: 'shorts' }] }], 1, 2))
      .mockResolvedValueOnce(genderPage([{ Gender: 'Women', Subcategories: [{ Slug: 'tops' }] }], 2, 2));

    await expect(getSubcategoryGenders()).resolves.toEqual({ shorts: ['Men'], tops: ['Women'] });
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(decodeURIComponent(mockFetch.mock.calls[1][0])).toContain('pagination[page]=2');
  });

  it('returns null when any request fails, so the menu falls back to all subcategories (AC3, AC11)', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    await expect(getSubcategoryGenders()).resolves.toBeNull();

    mockFetch.mockReset();
    mockFetch
      .mockResolvedValueOnce(genderPage([{ Gender: 'Men', Subcategories: [{ Slug: 'shorts' }] }], 1, 2))
      .mockResolvedValueOnce(strapiResponse({ error: { status: 500 } }, 500));
    await expect(getSubcategoryGenders()).resolves.toBeNull();
  });
});

describe('getNavigation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('returns categories and subcategory genders together (AC1, AC3)', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      url.includes('/api/categories?')
        ? strapiResponse({ data: CATEGORIES })
        : genderPage([{ Gender: 'Unisex', Subcategories: [{ Slug: 'tshirts-tanks' }] }])
    );

    const nav = await getNavigation();
    expect(nav.categories.map((c) => c.Slug)).toEqual(['surfboards', 'wetsuits']);
    expect(nav.subcategoryGenders).toEqual({ 'tshirts-tanks': ['Unisex'] });
  });

  it('keeps the categories when only the gender request fails (AC11)', async () => {
    mockFetch.mockImplementation(async (url: string) =>
      url.includes('/api/categories?') ? strapiResponse({ data: CATEGORIES }) : strapiResponse({}, 500)
    );

    const nav = await getNavigation();
    expect(nav.categories).toHaveLength(2);
    expect(nav.subcategoryGenders).toBeNull();
  });
});
