import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError } from '../../cart/cart-logic';
import { createIdentify } from '../../cart/identity';
import { WishlistError, parseSlug, type WishlistErrorCode } from '../wishlist-logic';
import type { WishlistStore } from '../wishlist-store';

const STATUS: Record<WishlistErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'not-found': 404,
};

const unauthorized = () => new WishlistError('unauthorized', 'Sign in to continue.');

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const store = () => strapi.service('api::wishlist.wishlist') as unknown as WishlistStore;
  const identify = createIdentify(strapi);

  async function requireUser(ctx: Context): Promise<string> {
    const identity = await identify(ctx).catch((error) => {
      if (error instanceof CartError && error.code === 'unauthorized') throw unauthorized();
      throw error;
    });
    if (identity.kind !== 'user') throw unauthorized();
    return identity.userDocumentId;
  }

  async function respond(ctx: Context, run: () => Promise<unknown>) {
    try {
      ctx.body = await run();
      ctx.status = 200;
    } catch (error) {
      if (!(error instanceof WishlistError)) throw error;
      ctx.status = STATUS[error.code];
      ctx.body = { error: { code: error.code, message: error.message } };
    }
  }

  return {
    list: (ctx: Context) => respond(ctx, async () => ({ items: await store().list(await requireUser(ctx)) })),

    add: (ctx: Context) =>
      respond(ctx, async () => {
        const user = await requireUser(ctx);
        await store().add(user, parseSlug(ctx.params.slug));
        return { ok: true };
      }),

    remove: (ctx: Context) =>
      respond(ctx, async () => {
        const user = await requireUser(ctx);
        await store().remove(user, parseSlug(ctx.params.slug));
        return { ok: true };
      }),
  };
};
