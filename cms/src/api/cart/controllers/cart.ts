import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError, parseLineBody, type CartErrorCode } from '../cart-logic';
import type { CartStore } from '../cart-store';
import { TOKEN_PATTERN, createIdentify, unauthorized } from '../identity';

const STATUS: Record<CartErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'not-found': 404,
  'sold-out': 409,
};

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const store = () => strapi.service('api::cart.cart') as unknown as CartStore;

  const identify = createIdentify(strapi);

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
