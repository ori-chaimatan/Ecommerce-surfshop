import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CartResponse } from '../../src/api/cart/cart-logic';
import { validatePlaceOrder } from '../../src/api/order/order-logic';
import { isOrderStore } from '../../src/api/order/order-guard';
import { ORDER_UID, createOrderStore } from '../../src/api/order/order-store';

const NOW = new Date('2026-10-11T12:00:00Z');
const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';
const user = { kind: 'user', userId: 7, userDocumentId: 'user-doc-7', email: 'jamie@example.com' } as const;

const boardLine = {
  productDocumentId: 'board-1',
  slug: 'ci-pro',
  name: 'CI Pro',
  price: 829,
  sizeType: 'Surfboard' as const,
  sizeKey: '6-0-29.4',
  size: { LengthFt: 6, LengthInches: 0, VolumeL: 29.4 },
  quantity: 1,
  stock: 3,
  image: null,
  soldOut: false,
  unavailable: false,
  adjusted: false,
};
const shortsLine = {
  ...boardLine,
  productDocumentId: 'shorts-1',
  slug: 'samurai',
  name: 'Samurai',
  price: 39.99,
  sizeType: 'Standard' as const,
  sizeKey: 'M',
  size: { Size: 'M' as const },
  quantity: 2,
  stock: 5,
};
const liveCart: CartResponse = { lines: [boardLine, shortsLine], removedCount: 0 };

const products: Record<string, object> = {
  'board-1': {
    documentId: 'board-1',
    SizeType: 'Surfboard',
    BoardSizes: [
      { id: 11, LengthFt: 5, LengthInches: 10, VolumeL: '27.50', Stock: 0 },
      { id: 12, LengthFt: 6, LengthInches: 0, VolumeL: '29.40', Stock: 3 },
    ],
    StandardSizes: [],
  },
  'shorts-1': {
    documentId: 'shorts-1',
    SizeType: 'Standard',
    BoardSizes: [],
    StandardSizes: [
      { id: 21, Size: 'S', Stock: 4 },
      { id: 22, Size: 'M', Stock: 5 },
    ],
  },
};

const input = (overrides: Record<string, unknown> = {}) =>
  validatePlaceOrder(
    {
      idempotencyKey: KEY,
      shipping: { firstName: 'Jamie', lastName: 'Rivera', address1: '1 Ocean Ave', city: 'Santa Cruz', state: 'CA', postalCode: '95060' },
      shippingMethod: 'standard',
      card: { number: '4242424242424242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' },
      expected: {
        total: 908.98,
        lines: liveCart.lines.map((l) => ({ productDocumentId: l.productDocumentId, sizeKey: l.sizeKey, quantity: l.quantity, unitPrice: l.price })),
      },
      ...overrides,
    },
    NOW
  );

const storedOrder = (data: Record<string, unknown>) => ({ id: 1, documentId: 'order-doc', Lines: [], Subtotal: 0, ShippingCost: 0, Total: 0, ...data });

function fakeEnv() {
  const log: string[] = [];
  /** Rows a conditional decrement affects, per size row id (default 1). */
  const affected: Record<number, number> = {};

  const builder = (table: string) => {
    const state: { where?: Record<string, unknown>; gte?: [string, number] } = {};
    const chain = {
      transacting: vi.fn(() => chain),
      where: vi.fn((where: Record<string, unknown>) => ((state.where = where), chain)),
      andWhere: vi.fn((column: string, _op: string, value: number) => ((state.gte = [column, value]), chain)),
      forUpdate: vi.fn(() => chain),
      select: vi.fn(async () => {
        log.push(`lock ${table} ${JSON.stringify(state.where)}`);
        return [{ id: 1 }];
      }),
      decrement: vi.fn(async (column: string, amount: number) => {
        const id = state.where?.id as number;
        log.push(`decrement ${table}#${id} ${column} by ${amount} where ${state.gte?.[0]} >= ${state.gte?.[1]}`);
        return affected[id] ?? 1;
      }),
    };
    return chain;
  };

  const orders = {
    findFirst: vi.fn(async (_params: object): Promise<unknown> => null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
      log.push(`create order ${data.OrderNumber}`);
      return storedOrder(data);
    }),
  };

  const productQuery = {
    findOne: vi.fn(async ({ where }: { where: { documentId: string } }) => products[where.documentId] ?? null),
  };

  const strapi = {
    documents: vi.fn((uid: string) => {
      if (uid !== ORDER_UID) throw new Error(`unexpected uid ${uid}`);
      return orders;
    }),
    db: {
      metadata: {
        get: vi.fn((uid: string) => {
          const tables: Record<string, string> = {
            'product.board-size': 'components_product_board_sizes',
            'product.standard-size': 'components_product_standard_sizes',
            'api::cart.cart': 'carts',
          };
          return { tableName: tables[uid], attributes: { Stock: { columnName: 'stock' }, documentId: { columnName: 'document_id' } } };
        }),
      },
      query: vi.fn(() => productQuery),
      connection: vi.fn((table: string) => builder(table)),
      transaction: vi.fn(async (run: (ctx: { trx: object }) => Promise<unknown>) => {
        log.push('begin');
        try {
          const result = await run({ trx: { id: 'trx' } });
          log.push('commit');
          return result;
        } catch (error) {
          log.push('rollback');
          throw error;
        }
      }),
    },
  };

  const cartStore = {
    findId: vi.fn(async (): Promise<string | null> => 'cart-doc'),
    read: vi.fn(async (): Promise<CartResponse> => liveCart),
    clearLines: vi.fn(async (id: string) => void log.push(`clear cart ${id}`)),
  };

  return { strapi, orders, cartStore, productQuery, log, affected };
}

describe('order store: place (AC4–AC6)', () => {
  let env: ReturnType<typeof fakeEnv>;
  let store: ReturnType<typeof createOrderStore>;
  let numbers: number[];

  beforeEach(() => {
    env = fakeEnv();
    numbers = [104233, 555555, 600000, 700000, 800000, 900000];
    store = createOrderStore(env.strapi as never, {
      cartStore: env.cartStore as never,
      now: () => NOW,
      nextNumber: () => numbers.shift()!,
      newReference: () => 'mock_ref',
    });
  });

  it('locks the cart, decrements each size conditionally, charges, creates the order and clears the cart in one transaction', async () => {
    const result = await store.place(user, input());

    expect(result.replayed).toBe(false);
    expect(result.order.orderNumber).toBe('WL-104233');
    expect(env.log).toEqual([
      'begin',
      'lock carts {"document_id":"cart-doc"}',
      'decrement components_product_board_sizes#12 stock by 1 where stock >= 1',
      'decrement components_product_standard_sizes#22 stock by 2 where stock >= 2',
      'create order WL-104233',
      'clear cart cart-doc',
      'commit',
    ]);
    expect(env.cartStore.read).toHaveBeenCalledWith(user);
  });

  it('writes the snapshot with brand, last 4 and reference only', async () => {
    await store.place(user, input());
    const data = env.orders.create.mock.calls[0][0].data;

    expect(data).toMatchObject({
      OrderNumber: 'WL-104233',
      User: 'user-doc-7',
      Email: 'jamie@example.com',
      Total: 908.98,
      PaymentBrand: 'visa',
      PaymentLast4: '4242',
      PaymentReference: 'mock_ref',
      IdempotencyKey: KEY,
      PlacedAt: NOW.toISOString(),
    });
    expect(JSON.stringify(data)).not.toContain('4242424242424242');
  });

  it('creates the order as the order store, so the order guard lets it through', async () => {
    let flagged: boolean | null = null;
    env.orders.create.mockImplementationOnce(async ({ data }: { data: Record<string, unknown> }) => {
      flagged = isOrderStore();
      return storedOrder(data);
    });

    await store.place(user, input());
    expect(flagged).toBe(true);
    expect(isOrderStore()).toBe(false);
  });

  it('returns the existing order for a known idempotency key without opening a transaction', async () => {
    env.orders.findFirst.mockResolvedValueOnce(storedOrder({ OrderNumber: 'WL-111111' }));

    const result = await store.place(user, input());

    expect(result).toMatchObject({ replayed: true, order: { orderNumber: 'WL-111111' } });
    expect(env.strapi.db.transaction).not.toHaveBeenCalled();
    expect(env.orders.findFirst.mock.calls[0][0]).toMatchObject({ filters: { IdempotencyKey: KEY, User: { id: 7 } } });
  });

  it('re-checks the key under the cart lock, so a concurrent duplicate returns the first order', async () => {
    env.orders.findFirst
      .mockResolvedValueOnce(null) // before the lock
      .mockResolvedValueOnce(storedOrder({ OrderNumber: 'WL-222222' })); // under the lock

    const result = await store.place(user, input());

    expect(result).toMatchObject({ replayed: true, order: { orderNumber: 'WL-222222' } });
    expect(env.log).toEqual(['begin', 'lock carts {"document_id":"cart-doc"}', 'commit']);
  });

  it('throws cart-empty when the user has no cart', async () => {
    env.cartStore.findId.mockResolvedValueOnce(null);
    await expect(store.place(user, input())).rejects.toMatchObject({ code: 'cart-empty' });
    expect(env.strapi.db.transaction).not.toHaveBeenCalled();
  });

  it('rolls back with cart-changed when the cart differs from the review, touching no stock', async () => {
    env.cartStore.read.mockResolvedValueOnce({ ...liveCart, lines: [{ ...boardLine, price: 799 }, shortsLine] });

    await expect(store.place(user, input())).rejects.toMatchObject({ code: 'cart-changed', lineKeys: ['board-1:6-0-29.4'] });
    expect(env.log.some((entry) => entry.startsWith('decrement'))).toBe(false);
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('rolls back with cart-changed and the sold-out keys when a decrement affects no row', async () => {
    env.affected[22] = 0;

    await expect(store.place(user, input())).rejects.toMatchObject({ code: 'cart-changed', lineKeys: ['shorts-1:M'] });
    expect(env.orders.create).not.toHaveBeenCalled();
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('rolls back with cart-changed when a size disappeared before the decrement', async () => {
    env.productQuery.findOne.mockImplementationOnce(async () => ({ ...products['board-1'], BoardSizes: [] }));

    await expect(store.place(user, input())).rejects.toMatchObject({ code: 'cart-changed', lineKeys: ['board-1:6-0-29.4'] });
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('rolls back a declined card: no order, no cleared cart, and the decrements are undone', async () => {
    const declined = input({ card: { number: '4000000000000002', expMonth: 12, expYear: 2030, cvc: '123', name: 'J' } });

    await expect(store.place(user, declined)).rejects.toMatchObject({ code: 'card-declined' });
    expect(env.orders.create).not.toHaveBeenCalled();
    expect(env.cartStore.clearLines).not.toHaveBeenCalled();
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('rolls back a processing error as payment-error', async () => {
    const failing = input({ card: { number: '4000000000000119', expMonth: 12, expYear: 2030, cvc: '123', name: 'J' } });

    await expect(store.place(user, failing)).rejects.toMatchObject({ code: 'payment-error' });
    expect(env.orders.create).not.toHaveBeenCalled();
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('retries a taken order number', async () => {
    env.orders.findFirst.mockImplementation(async (params: object) => {
      const filters = (params as { filters: Record<string, unknown> }).filters;
      return filters.OrderNumber === 'WL-104233' ? storedOrder({ OrderNumber: 'WL-104233' }) : null;
    });

    const result = await store.place(user, input());
    expect(result.order.orderNumber).toBe('WL-555555');
  });

  it('fails after 5 taken order numbers', async () => {
    env.orders.findFirst.mockImplementation(async (params: object) => {
      const filters = (params as { filters: Record<string, unknown> }).filters;
      return filters.OrderNumber ? storedOrder({}) : null;
    });

    await expect(store.place(user, input())).rejects.toThrow(/order number/);
    expect(env.log.at(-1)).toBe('rollback');
  });

  it('passes unexpected errors through after rolling back', async () => {
    env.orders.create.mockRejectedValueOnce(new Error('db down'));
    await expect(store.place(user, input())).rejects.toThrow('db down');
    expect(env.log.at(-1)).toBe('rollback');
  });
});

describe('order store: reads (AC8)', () => {
  it('finds an order by number for its owner only', async () => {
    const env = fakeEnv();
    const store = createOrderStore(env.strapi as never, { cartStore: env.cartStore as never });
    env.orders.findFirst.mockResolvedValueOnce(storedOrder({ OrderNumber: 'WL-104233' }));

    await expect(store.findByNumber(user, 'WL-104233')).resolves.toMatchObject({ orderNumber: 'WL-104233' });
    expect(env.orders.findFirst.mock.calls[0][0]).toMatchObject({
      filters: { OrderNumber: 'WL-104233', User: { id: 7 } },
      populate: { ShippingAddress: true, Lines: true },
    });
  });

  it('returns null for an unknown number or another user', async () => {
    const env = fakeEnv();
    const store = createOrderStore(env.strapi as never, { cartStore: env.cartStore as never });
    await expect(store.findByNumber(user, 'WL-000000')).resolves.toBeNull();
  });

  it('skips the lookup for a malformed number', async () => {
    const env = fakeEnv();
    const store = createOrderStore(env.strapi as never, { cartStore: env.cartStore as never });
    await expect(store.findByNumber(user, 'nope')).resolves.toBeNull();
    expect(env.orders.findFirst).not.toHaveBeenCalled();
  });
});
