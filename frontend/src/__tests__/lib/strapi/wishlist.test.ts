// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/lib/strapi/wishlist';

const mockFetch = vi.fn();
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

const item = (slug: string, extra: object = {}) => ({
  Name: `Product ${slug}`,
  Slug: slug,
  Price: 79,
  Images: [{ url: `/uploads/${slug}.jpg`, width: 800, height: 1000 }],
  Category: { Slug: 'clothing' },
  ...extra,
});

const call = (n = 0) => mockFetch.mock.calls[n] as [string, RequestInit];

describe('lib/strapi/wishlist (wishlist AC5, AC9, AC11)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('getWishlist', () => {
    it("maps the user's items to product cards, in order", async () => {
      mockFetch.mockResolvedValueOnce(json({ items: [item('newer'), item('older')] }));

      const result = await getWishlist('jwt-1');

      expect(result?.map((card) => card.slug)).toEqual(['newer', 'older']);
      expect(result?.[0]).toMatchObject({ slug: 'newer', name: 'Product newer', price: 79, href: '/products/newer' });
      expect(call()[0]).toMatch(/\/api\/wishlist$/);
      expect((call()[1].headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
      expect(call()[1].cache).toBe('no-store');
    });

    it('drops items the card mapper rejects', async () => {
      mockFetch.mockResolvedValueOnce(json({ items: [item('ok'), item('no-images', { Images: [] })] }));
      expect((await getWishlist('jwt-1'))?.map((card) => card.slug)).toEqual(['ok']);
    });

    it('returns null on a rejected session, an error or a bad shape', async () => {
      mockFetch.mockResolvedValueOnce(json({ error: {} }, 401));
      expect(await getWishlist('jwt-1')).toBeNull();
      mockFetch.mockRejectedValueOnce(new Error('down'));
      expect(await getWishlist('jwt-1')).toBeNull();
      mockFetch.mockResolvedValueOnce(json({ nope: true }));
      expect(await getWishlist('jwt-1')).toBeNull();
    });
  });

  describe('addToWishlist / removeFromWishlist', () => {
    it('PUTs and DELETEs the product by slug with the JWT', async () => {
      mockFetch.mockResolvedValueOnce(json({ ok: true })).mockResolvedValueOnce(json({ ok: true }));

      expect(await addToWishlist('jwt-1', 'samurai')).toBe('ok');
      expect(await removeFromWishlist('jwt-1', 'samurai')).toBe('ok');

      expect(call(0)[0]).toMatch(/\/api\/wishlist\/items\/samurai$/);
      expect(call(0)[1].method).toBe('PUT');
      expect(call(1)[1].method).toBe('DELETE');
      expect((call(1)[1].headers as Record<string, string>).Authorization).toBe('Bearer jwt-1');
    });

    it.each([
      [401, 'unauthorized'],
      [404, 'not-found'],
      [400, 'failed'],
      [500, 'failed'],
    ])('maps %s to %s', async (status, expected) => {
      mockFetch.mockResolvedValueOnce(json({ error: {} }, status));
      expect(await addToWishlist('jwt-1', 'samurai')).toBe(expected);
    });

    it('maps a network failure to failed', async () => {
      mockFetch.mockRejectedValueOnce(new Error('down'));
      expect(await removeFromWishlist('jwt-1', 'samurai')).toBe('failed');
    });
  });
});
