import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PRODUCT_UID, WISHLIST_UID, createWishlistStore } from '../../src/api/wishlist/wishlist-store';

const USER = 'user-doc-7';

const product = (slug: string, extra: object = {}) => ({
  documentId: `doc-${slug}`,
  Name: slug.toUpperCase(),
  Slug: slug,
  Price: 79,
  Images: [{ url: `/uploads/${slug}.jpg`, width: 800, height: 1000 }],
  Category: { Slug: 'clothing' },
  ...extra,
});

function fakeStrapi() {
  const items = { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() };
  const products = { findFirst: vi.fn() };
  const strapi = { documents: vi.fn((uid: string) => (uid === WISHLIST_UID ? items : products)) };
  return { strapi, items, products };
}

describe('wishlist store (wishlist AC5, AC9-AC11)', () => {
  let env: ReturnType<typeof fakeStrapi>;
  let store: ReturnType<typeof createWishlistStore>;

  beforeEach(() => {
    env = fakeStrapi();
    store = createWishlistStore(env.strapi as never);
  });

  describe('list', () => {
    it("reads only the user's items, newest first, with the card fields", async () => {
      env.items.findMany.mockResolvedValue([
        { documentId: 'w2', Product: product('newer') },
        { documentId: 'w1', Product: product('older') },
      ]);

      const items = await store.list(USER);

      expect(items.map((item) => item.Slug)).toEqual(['newer', 'older']);
      expect(items[0]).toEqual({
        Name: 'NEWER',
        Slug: 'newer',
        Price: 79,
        Images: [{ url: '/uploads/newer.jpg', width: 800, height: 1000 }],
        Category: { Slug: 'clothing' },
      });
      expect(env.items.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { User: { documentId: USER } },
          sort: 'createdAt:desc',
          populate: {
            Product: {
              fields: ['Name', 'Slug', 'Price'],
              populate: { Images: { fields: ['url', 'width', 'height'] }, Category: { fields: ['Slug'] } },
            },
          },
        })
      );
    });

    it('drops items whose product was deleted, and cleans them up (AC10)', async () => {
      env.items.findMany.mockResolvedValue([
        { documentId: 'w2', Product: null },
        { documentId: 'w1', Product: product('kept') },
      ]);

      const items = await store.list(USER);

      expect(items.map((item) => item.Slug)).toEqual(['kept']);
      expect(env.items.delete).toHaveBeenCalledWith({ documentId: 'w2' });
    });

    it('keeps one entry per product even if a race stored two', async () => {
      env.items.findMany.mockResolvedValue([
        { documentId: 'w3', Product: product('same') },
        { documentId: 'w2', Product: product('same') },
      ]);

      expect((await store.list(USER)).map((item) => item.Slug)).toEqual(['same']);
    });
  });

  describe('add', () => {
    it('saves a product for the user once (AC9)', async () => {
      env.products.findFirst.mockResolvedValue({ documentId: 'doc-samurai' });
      env.items.findFirst.mockResolvedValue(null);

      await store.add(USER, 'samurai');

      expect(env.products.findFirst).toHaveBeenCalledWith({ filters: { Slug: 'samurai' }, fields: ['Slug'] });
      expect(env.items.findFirst).toHaveBeenCalledWith({
        filters: { User: { documentId: USER }, Product: { documentId: 'doc-samurai' } },
        fields: [],
      });
      expect(env.items.create).toHaveBeenCalledWith({ data: { User: USER, Product: 'doc-samurai' } });
    });

    it('is a no-op when the product is already saved (AC9)', async () => {
      env.products.findFirst.mockResolvedValue({ documentId: 'doc-samurai' });
      env.items.findFirst.mockResolvedValue({ documentId: 'w1' });

      await store.add(USER, 'samurai');

      expect(env.items.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown product with not-found and writes nothing (AC9)', async () => {
      env.products.findFirst.mockResolvedValue(null);

      await expect(store.add(USER, 'nope')).rejects.toMatchObject({ code: 'not-found' });
      expect(env.items.create).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it("deletes the user's saved entries for that product only", async () => {
      env.items.findMany.mockResolvedValue([{ documentId: 'w1' }]);

      await store.remove(USER, 'samurai');

      expect(env.items.findMany).toHaveBeenCalledWith({
        filters: { User: { documentId: USER }, Product: { Slug: 'samurai' } },
        fields: [],
      });
      expect(env.items.delete).toHaveBeenCalledWith({ documentId: 'w1' });
    });

    it('is a no-op when the product is not saved (AC9)', async () => {
      env.items.findMany.mockResolvedValue([]);

      await store.remove(USER, 'samurai');

      expect(env.items.delete).not.toHaveBeenCalled();
    });
  });
});
