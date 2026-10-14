import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CartError } from '../../src/api/cart/cart-logic';
import { OrderError } from '../../src/api/order/order-logic';
import routes from '../../src/api/order/routes/order';

const mocks = vi.hoisted(() => ({ identify: vi.fn(), sendOrderEmail: vi.fn() }));
vi.mock('../../src/api/cart/identity', () => ({ createIdentify: () => mocks.identify }));
vi.mock('../../src/api/order/order-email', () => ({ sendOrderEmail: mocks.sendOrderEmail }));

import controllerFactory from '../../src/api/order/controllers/order';

const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';
const user = { kind: 'user', userId: 7, userDocumentId: 'user-doc-7', email: 'jamie@example.com' };
const orderView = { orderNumber: 'WL-104233', email: 'jamie@example.com', total: 908.98 };

const body = {
  idempotencyKey: KEY,
  shipping: { firstName: 'Jamie', lastName: 'Rivera', address1: '1 Ocean Ave', city: 'Santa Cruz', state: 'CA', postalCode: '95060' },
  shippingMethod: 'standard',
  card: { number: '4242424242424242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' },
  expected: { total: 829, lines: [{ productDocumentId: 'board-1', sizeKey: '6-0-29.4', quantity: 1, unitPrice: 829 }] },
};

function setup() {
  const store = { place: vi.fn(), findByNumber: vi.fn(), listForUser: vi.fn() };
  const strapi = { service: vi.fn(() => store), log: { error: vi.fn() } };
  const controller = controllerFactory({ strapi: strapi as never });
  const ctx = (request: { body?: unknown; params?: Record<string, string> } = {}) =>
    ({ request: { body: request.body, header: {} }, params: request.params ?? {}, status: 200, body: undefined }) as {
      status: number;
      body: unknown;
    } & Record<string, unknown>;
  return { store, controller, ctx, strapi };
}

describe('order routes (AC3, AC8)', () => {
  it('declares only POST /orders, GET /orders (order-history) and GET /orders/:orderNumber, with auth handled in the controller', () => {
    expect(routes.routes).toEqual([
      { method: 'POST', path: '/orders', handler: 'order.place', config: { auth: false } },
      { method: 'GET', path: '/orders', handler: 'order.list', config: { auth: false } },
      { method: 'GET', path: '/orders/:orderNumber', handler: 'order.findOne', config: { auth: false } },
    ]);
  });
});

describe('order controller: place (AC3–AC7, AC16)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.identify.mockResolvedValue(user);
    mocks.sendOrderEmail.mockResolvedValue(undefined); // like the real one: a promise that never rejects
    env = setup();
  });

  it('creates an order: 201, the order view, then the email', async () => {
    env.store.place.mockResolvedValue({ replayed: false, order: orderView });
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(201);
    expect(ctx.body).toEqual({ order: orderView });
    expect(env.store.place).toHaveBeenCalledWith(user, expect.objectContaining({ idempotencyKey: KEY, shippingMethod: 'standard' }));
    expect(mocks.sendOrderEmail).toHaveBeenCalledWith(expect.anything(), orderView);
  });

  it('answers without waiting for the confirmation email (fire-and-forget)', async () => {
    env.store.place.mockResolvedValue({ replayed: false, order: orderView });
    mocks.sendOrderEmail.mockReturnValue(new Promise(() => {})); // an SMTP send that never finishes
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(201);
    expect(ctx.body).toEqual({ order: orderView });
    expect(mocks.sendOrderEmail).toHaveBeenCalledTimes(1);
  });

  it('logs an email failure without affecting the response', async () => {
    env.store.place.mockResolvedValue({ replayed: false, order: orderView });
    mocks.sendOrderEmail.mockRejectedValue(new Error('smtp down'));
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);
    await new Promise((resolve) => setImmediate(resolve));

    expect(ctx.status).toBe(201);
    expect(env.strapi.log.error).toHaveBeenCalledWith('[order email] failed to send WL-104233', expect.any(Error));
  });

  it('answers a replayed key with 200 and the same order, without a second email', async () => {
    env.store.place.mockResolvedValue({ replayed: true, order: orderView });
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ order: orderView });
    expect(mocks.sendOrderEmail).not.toHaveBeenCalled();
  });

  it.each([
    ['no session', { kind: 'none' }],
    ['a guest', { kind: 'guest', token: KEY }],
  ])('rejects %s with 401', async (_label, identity) => {
    mocks.identify.mockResolvedValue(identity);
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toEqual({ error: { code: 'unauthorized', message: expect.any(String) } });
    expect(env.store.place).not.toHaveBeenCalled();
  });

  it('maps an invalid JWT to 401', async () => {
    mocks.identify.mockRejectedValue(new CartError('unauthorized', 'Invalid or expired session.'));
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);
    expect(ctx.status).toBe(401);
  });

  it('answers a bad body with 400 and the field errors, before touching the store', async () => {
    const ctx = env.ctx({ body: { ...body, shipping: { ...body.shipping, postalCode: '12' } } });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({ error: { code: 'bad-request', message: expect.any(String), fields: { postalCode: expect.any(String) } } });
    expect(env.store.place).not.toHaveBeenCalled();
  });

  it.each([
    [new OrderError('cart-empty', 'Your cart is empty.'), 409],
    [new OrderError('cart-changed', 'changed', undefined, ['board-1:6-0-29.4']), 409],
    [new OrderError('card-declined', 'declined'), 402],
    [new OrderError('payment-error', 'error'), 502],
  ])('maps %s to its status, with no email', async (error, status) => {
    env.store.place.mockRejectedValue(error);
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);

    expect(ctx.status).toBe(status);
    expect((ctx.body as { error: { code: string } }).error.code).toBe(error.code);
    expect(mocks.sendOrderEmail).not.toHaveBeenCalled();
  });

  it('includes the changed line keys on cart-changed', async () => {
    env.store.place.mockRejectedValue(new OrderError('cart-changed', 'changed', undefined, ['shorts-1:M']));
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);
    expect(ctx.body).toEqual({ error: { code: 'cart-changed', message: 'changed', lineKeys: ['shorts-1:M'] } });
  });

  it('rethrows unexpected errors for Strapi to turn into a 500', async () => {
    env.store.place.mockRejectedValue(new Error('db down'));
    await expect(env.controller.place(env.ctx({ body }) as never)).rejects.toThrow('db down');
  });

  it('never echoes card data in any response', async () => {
    env.store.place.mockRejectedValue(new OrderError('card-declined', 'Your card was declined. Try another card.'));
    const ctx = env.ctx({ body });

    await env.controller.place(ctx as never);
    expect(JSON.stringify(ctx.body)).not.toContain('4242424242424242');
    expect(JSON.stringify(ctx.body)).not.toContain('"123"');
  });
});

describe('order controller: findOne (AC8)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.identify.mockResolvedValue(user);
    env = setup();
  });

  it("returns the owner's order", async () => {
    env.store.findByNumber.mockResolvedValue(orderView);
    const ctx = env.ctx({ params: { orderNumber: 'WL-104233' } });

    await env.controller.findOne(ctx as never);

    expect(env.store.findByNumber).toHaveBeenCalledWith(user, 'WL-104233');
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ order: orderView });
  });

  it("gives the same 404 for someone else's order and for an unknown number", async () => {
    env.store.findByNumber.mockResolvedValue(null);
    const other = env.ctx({ params: { orderNumber: 'WL-104233' } });
    const unknown = env.ctx({ params: { orderNumber: 'WL-000000' } });

    await env.controller.findOne(other as never);
    await env.controller.findOne(unknown as never);

    expect(other.status).toBe(404);
    expect(JSON.stringify(other.body)).toBe(JSON.stringify(unknown.body));
  });

  it('requires a signed-in user', async () => {
    mocks.identify.mockResolvedValue({ kind: 'none' });
    const ctx = env.ctx({ params: { orderNumber: 'WL-104233' } });

    await env.controller.findOne(ctx as never);
    expect(ctx.status).toBe(401);
  });
});

describe('order controller: list (order-history AC1, AC7)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.identify.mockResolvedValue(user);
    env = setup();
  });

  it("returns the signed-in user's orders", async () => {
    env.store.listForUser.mockResolvedValue([orderView]);
    const ctx = env.ctx();

    await env.controller.list(ctx as never);

    expect(env.store.listForUser).toHaveBeenCalledWith(user);
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ orders: [orderView] });
  });

  it.each([
    ['nobody', () => mocks.identify.mockResolvedValue({ kind: 'none' })],
    ['a guest', () => mocks.identify.mockResolvedValue({ kind: 'guest', token: 'x' })],
    ['a bad JWT', () => mocks.identify.mockRejectedValue(new CartError('unauthorized', 'Invalid or expired session.'))],
  ])('answers 401 for %s without reading orders', async (_who, arrange) => {
    arrange();
    const ctx = env.ctx();
    await env.controller.list(ctx as never);
    expect(ctx.status).toBe(401);
    expect(env.store.listForUser).not.toHaveBeenCalled();
  });
});
