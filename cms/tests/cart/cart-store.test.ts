import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CART_UID, PRODUCT_UID, createCartStore } from '../../src/api/cart/cart-store';
import type { CartProduct } from '../../src/api/cart/cart-logic';

const shorts: CartProduct = {
  documentId: 'shorts-1',
  Name: 'Samurai',
  Slug: 'samurai',
  Price: 79,
  SizeType: 'Standard',
  Images: [],
  BoardSizes: [],
  StandardSizes: [{ Size: 'M', Stock: 2 }],
};

function fakeStrapi() {
  const carts = {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const products = { findOne: vi.fn() };
  const strapi = {
    documents: vi.fn((uid: string) => (uid === CART_UID ? carts : products)),
  };
  return { strapi, carts, products };
}

const guest = { kind: 'guest', token: 'guest-token' } as const;
const user = { kind: 'user', userId: 7, userDocumentId: 'user-doc-7' } as const;

describe('cart store', () => {
  let env: ReturnType<typeof fakeStrapi>;
  let store: ReturnType<typeof createCartStore>;

  beforeEach(() => {
    env = fakeStrapi();
    store = createCartStore(env.strapi as never, () => 'new-token');
  });

  it('reads carts and their products as the published version only (AC4)', async () => {
    env.carts.findFirst.mockResolvedValue(null);
    await store.read(guest);

    expect(env.carts.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'published',
        filters: { Token: 'guest-token', User: { id: { $null: true } } },
      })
    );
  });

  it('loads the product being added as the published version only', async () => {
    env.carts.findFirst.mockResolvedValue(null);
    env.products.findOne.mockResolvedValue(null);

    await expect(store.add(guest, { productDocumentId: 'gone', sizeKey: 'M' })).rejects.toMatchObject({ code: 'not-found' });
    expect(env.products.findOne).toHaveBeenCalledWith(expect.objectContaining({ documentId: 'gone', status: 'published' }));
  });

  it('treats an unpublished product on a stored line like a deleted one: pruned and counted (AC4)', async () => {
    // With status: 'published', Strapi populates a draft-only product as null.
    env.carts.findFirst.mockResolvedValue({
      documentId: 'cart-1',
      Lines: [
        { Product: null, SizeKey: 'M', Quantity: 1 },
        { Product: shorts, SizeKey: 'M', Quantity: 1 },
      ],
    });

    const response = await store.read(guest);

    expect(response.removedCount).toBe(1);
    expect(response.lines).toHaveLength(1);
    expect(env.carts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'cart-1',
        data: { Lines: [{ Product: 'shorts-1', SizeKey: 'M', Quantity: 1 }] },
      })
    );
  });

  it('returns an empty cart and creates nothing when there is no cart (AC2)', async () => {
    env.carts.findFirst.mockResolvedValue(null);
    expect(await store.read(guest)).toEqual({ lines: [], removedCount: 0 });
    expect(await store.read({ kind: 'none' })).toEqual({ lines: [], removedCount: 0 });
    expect(env.carts.create).not.toHaveBeenCalled();
  });

  it('creates a guest cart with a new token on the first add and returns the token (AC2)', async () => {
    // No identity → no lookup; the only read is of the new cart by its token.
    env.carts.findFirst.mockResolvedValueOnce({
      documentId: 'cart-1',
      Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 1 }],
    });
    env.products.findOne.mockResolvedValue(shorts);

    const response = await store.add({ kind: 'none' }, { productDocumentId: 'shorts-1', sizeKey: 'M' });

    expect(env.carts.create).toHaveBeenCalledWith({
      data: { Token: 'new-token', Lines: [{ Product: 'shorts-1', SizeKey: 'M', Quantity: 1 }] },
    });
    expect(response.token).toBe('new-token');
    expect(response.lines[0]).toMatchObject({ productDocumentId: 'shorts-1', quantity: 1 });
  });

  it('creates a user cart attached to the user on their first add', async () => {
    env.carts.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce({
      documentId: 'cart-1',
      Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 1 }],
    });
    env.products.findOne.mockResolvedValue(shorts);

    const response = await store.add(user, { productDocumentId: 'shorts-1', sizeKey: 'M' });

    expect(env.carts.findFirst).toHaveBeenCalledWith(expect.objectContaining({ filters: { User: { id: 7 } } }));
    expect(env.carts.create).toHaveBeenCalledWith({
      data: { User: 'user-doc-7', Lines: [{ Product: 'shorts-1', SizeKey: 'M', Quantity: 1 }] },
    });
    expect(response.token).toBeUndefined();
  });

  it('merges the guest cart into the user cart and deletes the guest cart (AC5)', async () => {
    env.carts.findFirst
      .mockResolvedValueOnce({ documentId: 'user-cart', Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 1 }] })
      .mockResolvedValueOnce({ documentId: 'guest-cart', Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 5 }] })
      .mockResolvedValueOnce({ documentId: 'user-cart', Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 2 }] });

    const response = await store.merge(user, 'guest-token');

    expect(env.carts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'user-cart',
        data: { Lines: [{ Product: 'shorts-1', SizeKey: 'M', Quantity: 2 }] },
      })
    );
    expect(env.carts.delete).toHaveBeenCalledWith({ documentId: 'guest-cart' });
    expect(response.lines[0]).toMatchObject({ quantity: 2 });
  });

  it('turns the guest cart into the user cart when the user has none yet (AC5)', async () => {
    env.carts.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ documentId: 'guest-cart', Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 1 }] })
      .mockResolvedValueOnce({ documentId: 'guest-cart', Lines: [{ Product: shorts, SizeKey: 'M', Quantity: 1 }] });

    await store.merge(user, 'guest-token');

    expect(env.carts.update).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'guest-cart',
        data: { Token: null, User: 'user-doc-7', Lines: [{ Product: 'shorts-1', SizeKey: 'M', Quantity: 1 }] },
      })
    );
    expect(env.carts.delete).not.toHaveBeenCalled();
  });

  it('merging without a guest cart leaves the user cart as is', async () => {
    env.carts.findFirst.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(null);
    expect(await store.merge(user, 'missing')).toEqual({ lines: [], removedCount: 0 });
    expect(env.carts.update).not.toHaveBeenCalled();
    expect(env.carts.delete).not.toHaveBeenCalled();
  });
});
