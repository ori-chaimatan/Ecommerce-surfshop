import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountError } from '../../src/api/account/account-logic';
import { CartError } from '../../src/api/cart/cart-logic';
import routes from '../../src/api/account/routes/account';

const mocks = vi.hoisted(() => ({ identify: vi.fn() }));
vi.mock('../../src/api/cart/identity', () => ({ createIdentify: () => mocks.identify }));

import controllerFactory from '../../src/api/account/controllers/account';

const user = { kind: 'user', userId: 7, userDocumentId: 'user-doc-7', email: 'jamie@example.com' };
const body = { firstName: 'Jamie', lastName: 'Rivera', email: 'Jamie.New@example.com' };
const saved = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie.new@example.com' };

function setup() {
  const store = { updateProfile: vi.fn() };
  const strapi = { service: vi.fn(() => store) };
  const controller = controllerFactory({ strapi: strapi as never });
  const ctx = (requestBody?: unknown) =>
    ({ request: { body: requestBody, header: {} }, params: {}, status: 200, body: undefined }) as {
      status: number;
      body: unknown;
    } & Record<string, unknown>;
  return { store, strapi, controller, ctx };
}

describe('account routes', () => {
  it('declares only PATCH /account/profile, with auth handled in the controller', () => {
    expect(routes.routes).toEqual([
      { method: 'PATCH', path: '/account/profile', handler: 'account.updateProfile', config: { auth: false } },
    ]);
  });
});

describe('account controller: updateProfile (AC9-AC11)', () => {
  let env: ReturnType<typeof setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.identify.mockResolvedValue(user);
    env = setup();
  });

  it("saves the validated profile on the signed-in user's own id", async () => {
    env.store.updateProfile.mockResolvedValue(saved);
    const ctx = env.ctx({ ...body, id: 99, role: 1 });

    await env.controller.updateProfile(ctx as never);

    expect(env.strapi.service).toHaveBeenCalledWith('api::account.account');
    expect(env.store.updateProfile).toHaveBeenCalledWith(7, saved);
    expect(ctx.status).toBe(200);
    expect(ctx.body).toEqual({ profile: saved });
  });

  it('answers 400 with field errors for an invalid body, without saving', async () => {
    const ctx = env.ctx({ firstName: '', lastName: 'Rivera', email: 'nope' });

    await env.controller.updateProfile(ctx as never);

    expect(ctx.status).toBe(400);
    expect(ctx.body).toEqual({
      error: {
        code: 'bad-request',
        message: 'Check the highlighted fields.',
        fields: { firstName: 'Enter your first name.', email: 'Enter a valid email address.' },
      },
    });
    expect(env.store.updateProfile).not.toHaveBeenCalled();
  });

  it('answers 401 for a guest or no identity', async () => {
    mocks.identify.mockResolvedValue({ kind: 'guest', token: 'x' });
    const ctx = env.ctx(body);

    await env.controller.updateProfile(ctx as never);

    expect(ctx.status).toBe(401);
    expect(ctx.body).toMatchObject({ error: { code: 'unauthorized' } });
    expect(env.store.updateProfile).not.toHaveBeenCalled();
  });

  it('answers 401 for an invalid or expired JWT', async () => {
    mocks.identify.mockRejectedValue(new CartError('unauthorized', 'Invalid or expired session.'));
    const ctx = env.ctx(body);

    await env.controller.updateProfile(ctx as never);

    expect(ctx.status).toBe(401);
  });

  it('answers 409 with the email field error when the email is taken (AC11)', async () => {
    env.store.updateProfile.mockRejectedValue(
      new AccountError('email-taken', 'An account with this email already exists.', {
        email: 'An account with this email already exists.',
      })
    );
    const ctx = env.ctx(body);

    await env.controller.updateProfile(ctx as never);

    expect(ctx.status).toBe(409);
    expect(ctx.body).toEqual({
      error: {
        code: 'email-taken',
        message: 'An account with this email already exists.',
        fields: { email: 'An account with this email already exists.' },
      },
    });
  });

  it('rethrows unexpected errors for Strapi to turn into a 500', async () => {
    env.store.updateProfile.mockRejectedValue(new Error('db down'));

    await expect(env.controller.updateProfile(env.ctx(body) as never)).rejects.toThrow('db down');
  });
});
