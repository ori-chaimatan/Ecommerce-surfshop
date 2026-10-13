import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError, parseLineBody, type CartErrorCode } from '../cart-logic';
import type { CartIdentity, CartStore } from '../cart-store';

const USER_UID = 'plugin::users-permissions.user';
const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const STATUS: Record<CartErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'not-found': 404,
  'sold-out': 409,
};

const unauthorized = () => new CartError('unauthorized', 'Invalid or expired session.');

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const store = () => strapi.service('api::cart.cart') as unknown as CartStore;

  /** A Bearer JWT wins (and must be valid); otherwise a well-formed guest token; otherwise nobody. */
  async function identify(ctx: Context): Promise<CartIdentity> {
    const authorization = ctx.request.header.authorization;
    if (authorization) {
      const [scheme, jwt] = authorization.split(' ');
      if (scheme?.toLowerCase() !== 'bearer' || !jwt) throw unauthorized();

      const payload = await strapi
        .plugin('users-permissions')
        .service('jwt')
        .verify(jwt)
        .catch(() => null);
      const user = payload?.id ? await strapi.db.query(USER_UID).findOne({ where: { id: payload.id } }) : null;
      if (!user || user.blocked) throw unauthorized();
      return { kind: 'user', userId: user.id, userDocumentId: user.documentId };
    }

    const token = ctx.request.header['x-cart-token'];
    return typeof token === 'string' && TOKEN_PATTERN.test(token) ? { kind: 'guest', token } : { kind: 'none' };
  }

  async function respond(ctx: Context, run: () => Promise<unknown>) {
    try {
      ctx.body = await run();
    } catch (error) {
      if (!(error instanceof CartError)) throw error;
      ctx.status = STATUS[error.code];
      ctx.body = { error: { code: error.code, message: error.message } };
    }
  }

  return {
    current: (ctx: Context) => respond(ctx, async () => store().read(await identify(ctx))),

    addLine: (ctx: Context) =>
      respond(ctx, async () => store().add(await identify(ctx), parseLineBody(ctx.request.body, false))),

    setLineQuantity: (ctx: Context) =>
      respond(ctx, async () => store().setQuantity(await identify(ctx), parseLineBody(ctx.request.body, true))),

    removeLine: (ctx: Context) =>
      respond(ctx, async () => store().remove(await identify(ctx), parseLineBody(ctx.params, false))),

    merge: (ctx: Context) =>
      respond(ctx, async () => {
        const identity = await identify(ctx);
        const guestToken = ctx.request.header['x-cart-token'];
        if (identity.kind !== 'user') throw unauthorized();
        if (typeof guestToken !== 'string' || !TOKEN_PATTERN.test(guestToken)) {
          throw new CartError('bad-request', 'A guest cart token is required.');
        }
        return store().merge(identity, guestToken);
      }),
  };
};
