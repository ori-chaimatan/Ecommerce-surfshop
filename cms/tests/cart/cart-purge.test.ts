import { describe, expect, it, vi } from 'vitest';
import cronTasks from '../../config/cron-tasks';
import { CART_UID, abandonedCutoff, createCartStore } from '../../src/api/cart/cart-store';

const NOW = new Date('2026-10-11T03:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

describe('abandonedCutoff (checkout AC19)', () => {
  it('is 30 days before now, matching the guest cookie lifetime', () => {
    expect(abandonedCutoff(NOW).toISOString()).toBe(new Date(NOW.getTime() - 30 * DAY).toISOString());
  });
});

function fakeStrapi(pages: { documentId: string }[][]) {
  const carts = {
    findMany: vi.fn(async () => pages.shift() ?? []),
    delete: vi.fn(async () => ({})),
  };
  return { strapi: { documents: vi.fn((uid: string) => (uid === CART_UID ? carts : {})) }, carts };
}

describe('purgeAbandoned (checkout AC19)', () => {
  it('deletes guest carts (no User) not updated since the cutoff, through the document service', async () => {
    const env = fakeStrapi([[{ documentId: 'a' }, { documentId: 'b' }]]);
    const store = createCartStore(env.strapi as never);

    await expect(store.purgeAbandoned(NOW, 100)).resolves.toBe(2);

    expect(env.carts.findMany).toHaveBeenCalledWith({
      filters: { User: { id: { $null: true } }, updatedAt: { $lt: abandonedCutoff(NOW).toISOString() } },
      fields: ['documentId'],
      limit: 100,
    });
    expect(env.carts.delete).toHaveBeenCalledWith({ documentId: 'a' });
    expect(env.carts.delete).toHaveBeenCalledWith({ documentId: 'b' });
  });

  it('works in batches until a short page', async () => {
    const env = fakeStrapi([[{ documentId: 'a' }, { documentId: 'b' }], [{ documentId: 'c' }, { documentId: 'd' }], [{ documentId: 'e' }]]);
    const store = createCartStore(env.strapi as never);

    await expect(store.purgeAbandoned(NOW, 2)).resolves.toBe(5);
    expect(env.carts.findMany).toHaveBeenCalledTimes(3);
  });

  it('does nothing when no cart qualifies', async () => {
    const env = fakeStrapi([]);
    const store = createCartStore(env.strapi as never);

    await expect(store.purgeAbandoned(NOW)).resolves.toBe(0);
    expect(env.carts.delete).not.toHaveBeenCalled();
  });
});

describe('cron task (checkout AC19)', () => {
  it('runs the purge daily at 03:00', async () => {
    const purgeAbandoned = vi.fn(async () => 3);
    const info = vi.fn();
    const strapi = { service: vi.fn(() => ({ purgeAbandoned })), log: { info } };

    expect(cronTasks.purgeAbandonedGuestCarts.options).toEqual({ rule: '0 3 * * *' });
    await cronTasks.purgeAbandonedGuestCarts.task({ strapi: strapi as never });

    expect(strapi.service).toHaveBeenCalledWith('api::cart.cart');
    expect(purgeAbandoned).toHaveBeenCalledWith(expect.any(Date));
    expect(info).toHaveBeenCalledWith('[cart purge] deleted 3 abandoned guest carts');
  });
});
