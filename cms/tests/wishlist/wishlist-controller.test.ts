import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartError } from '../../src/api/cart/cart-logic';
import { WishlistError } from '../../src/api/wishlist/wishlist-logic';
import routes from '../../src/api/wishlist/routes/wishlist';

const mocks = vi.hoisted(() => ({ identify: vi.fn() }));
vi.mock('../../src/api/cart/identity', () => ({ createIdentify: () => mocks.identify }));

import controllerFactory from '../../src/api/wishlist/controllers/wishlist';

const user = { kind: 'user', userId: 7, userDocumentId: 'user-doc-7', email: 'jamie@example.com' };
const items = [{ Name: 'Samurai', Slug: 'samurai', Price: 79, Images: [], Category: { Slug: 'clothing' } }];

function setup() {
  const store = { list: vi.fn(), add: vi.fn(), remove: vi.fn() };
  const strapi = { service: vi.fn(() => store) };
  const controller = controllerFactory({ strapi: strapi as never });
  const ctx = (params: Record<string, string> = {}) =>
    ({ request: { body: undefined, header: {} }, params, status: 200, body: undefined }) as {
      status: number;
      body: unknown;
    } & Record<string, unknown>;
  return { store, strapi, controller, ctx };
}

describe('wishlist routes (wishlist AC11)', () => {
  it('declares only the three owner routes, with auth handled in the controller', () => {
    expect(routes.routes).toEqual([
      { method: 'GET', path: '/wishlist', handler: 'wishlist.list', config: { auth: false } },
      { method: 'PUT', path: '/wishlist/items/:slug', handler: 'wishlist.add', config: { auth: false } },
      { method: 'DELETE', path: '/wishlist/items/:slug', handler: 'wishlist.remove', config: { auth: false } },
    ]);
  });
});

describe('wishlist controller (wishlist AC5, AC9, AC11)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.identify.mockResolvedValue(user);
    env = setup();
  });

  it("lists the signed-in user's items", async () => {
    env.store.list.mockResolvedValue(items);
    const ctx = env.ctx();

    await env.controller.list(ctx as never);

    expect(env.strapi.service).toHaveBeenCalledWith('api::wishlist.wishlist');
    expect(env.store.list).toHaveBeenCalledWith('user-doc-7');
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ items });
  });

  it('adds and removes by slug for the signed-in user', async () => {
    const add = env.ctx({ slug: 'samurai' });
    await env.controller.add(add as never);
    expect(env.store.add).toHaveBeenCalledWith('user-doc-7', 'samurai');
    expect(add.status).toBe(200);
    expect(add.body).toEqual({ ok: true });

    const remove = env.ctx({ slug: 'samurai' });
    await env.controller.remove(remove as never);
    expect(env.store.remove).toHaveBeenCalledWith('user-doc-7', 'samurai');
    expect(remove.status).toBe(200);
  });

  it.each([
    ['a guest', () => mocks.identify.mockResolvedValue({ kind: 'guest', token: 'x' })],
    ['nobody', () => mocks.identify.mockResolvedValue({ kind: 'none' })],
    ['a bad JWT', () => mocks.identify.mockRejectedValue(new CartError('unauthorized', 'Invalid or expired session.'))],
  ])('answers 401 for %s on every route, touching nothing', async (_who, arrange) => {
    arrange();
    for (const action of ['list', 'add', 'remove'] as const) {
      const ctx = env.ctx({ slug: 'samurai' });
      await env.controller[action](ctx as never);
      expect(ctx.status).toBe(401);
      expect(ctx.body).toMatchObject({ error: { code: 'unauthorized' } });
    }
    expect(env.store.list).not.toHaveBeenCalled();
    expect(env.store.add).not.toHaveBeenCalled();
    expect(env.store.remove).not.toHaveBeenCalled();
  });

  it('answers 400 for a malformed slug', async () => {
    const ctx = env.ctx({ slug: 'Not A Slug' });
    await env.controller.add(ctx as never);
    expect(ctx.status).toBe(400);
    expect(env.store.add).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown product', async () => {
    env.store.add.mockRejectedValue(new WishlistError('not-found', 'Product not found.'));
    const ctx = env.ctx({ slug: 'nope' });
    await env.controller.add(ctx as never);
    expect(ctx.status).toBe(404);
    expect(ctx.body).toEqual({ error: { code: 'not-found', message: 'Product not found.' } });
  });

  it('rethrows unexpected errors', async () => {
    env.store.list.mockRejectedValue(new Error('db down'));
    await expect(env.controller.list(env.ctx() as never)).rejects.toThrow('db down');
  });
});
