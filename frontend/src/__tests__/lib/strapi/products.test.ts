// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PAGE_SIZE, getProductList } from '@/lib/strapi/products';

const mockFetch = vi.fn();

function strapiResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

function product(slug: string, extra: Record<string, unknown> = {}) {
  return {
    id: 1,
    Name: `Product ${slug}`,
    Slug: slug,
    Price: 79,
    Images: [{ url: `/uploads/${slug}.jpg`, width: 800, height: 1000 }],
    Category: { Slug: 'clothing' },
    ...extra,
  };
}

function page(data: unknown[], total: number, pageCount: number) {
  return { data, meta: { pagination: { page: 1, pageSize: PAGE_SIZE, total, pageCount } } };
}

function requestedUrl() {
  return decodeURIComponent(mockFetch.mock.calls[0][0]);
}

describe('getProductList', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('pages 16 at a time in stable id order (AC2)', () => {
    expect(PAGE_SIZE).toBe(16);
  });

  it('requests only the card fields, sorted by id, with page + pageSize, revalidating every 60s (AC2)', async () => {
    mockFetch.mockResolvedValue(strapiResponse(page([], 0, 0)));

    await getProductList({ page: 2 });

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain('http://localhost:1337/api/products?');
    const decoded = requestedUrl();
    expect(decoded).toContain('fields[0]=Name');
    expect(decoded).toContain('fields[1]=Slug');
    expect(decoded).toContain('fields[2]=Price');
    expect(decoded).toContain('populate[Images][fields][0]=url');
    expect(decoded).toContain('populate[Images][fields][1]=width');
    expect(decoded).toContain('populate[Images][fields][2]=height');
    expect(decoded).toContain('populate[Category][fields][0]=Slug');
    expect(decoded).toContain('sort[0]=id:asc');
    expect(decoded).toContain('pagination[page]=2');
    expect(decoded).toContain('pagination[pageSize]=16');
    expect(decoded).not.toContain('filters');
    expect(init).toEqual(expect.objectContaining({ next: { revalidate: 60 } }));
  });

  it('filters by category, subcategory and gender server-side (AC2)', async () => {
    mockFetch.mockResolvedValue(strapiResponse(page([], 0, 0)));

    await getProductList({ categorySlug: 'clothing', subcategorySlug: 'shorts', genders: ['Men', 'Unisex'], page: 1 });

    const decoded = requestedUrl();
    expect(decoded).toContain('filters[Category][Slug][$eq]=clothing');
    expect(decoded).toContain('filters[Subcategories][Slug][$eq]=shorts');
    expect(decoded).toContain('filters[Gender][$in][0]=Men');
    expect(decoded).toContain('filters[Gender][$in][1]=Unisex');
  });

  it('only sends the filters that are set (AC2)', async () => {
    mockFetch.mockResolvedValue(strapiResponse(page([], 0, 0)));

    await getProductList({ categorySlug: 'surfboards', page: 1 });

    const decoded = requestedUrl();
    expect(decoded).toContain('filters[Category][Slug][$eq]=surfboards');
    expect(decoded).not.toContain('Subcategories');
    expect(decoded).not.toContain('Gender');
  });

  it('maps products to cards with toProductCard, dropping invalid ones, and returns the totals (AC2, AC5)', async () => {
    mockFetch.mockResolvedValue(strapiResponse(page([product('a'), product('b', { Images: [] })], 17, 2)));

    const list = await getProductList({ page: 1 });

    expect(list).toEqual({
      products: [
        {
          slug: 'a',
          name: 'Product a',
          price: 79,
          href: '/products/a',
          images: [{ src: 'http://localhost:1337/uploads/a.jpg', width: 800, height: 1000 }],
          imageFit: 'cover',
        },
      ],
      total: 17,
      pageCount: 2,
    });
  });

  it('returns null on a network error, a non-2xx response or a malformed body (AC10)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('ECONNREFUSED'));
    await expect(getProductList({ page: 1 })).resolves.toBeNull();

    mockFetch.mockResolvedValueOnce(strapiResponse({ error: 'boom' }, 500));
    await expect(getProductList({ page: 1 })).resolves.toBeNull();

    mockFetch.mockResolvedValueOnce(strapiResponse({ data: [product('a')] }));
    await expect(getProductList({ page: 1 })).resolves.toBeNull();
  });
});
