import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError } from '../../cart/cart-logic';
import { createIdentify } from '../../cart/identity';
import { AccountError, validateProfile, type AccountErrorCode } from '../account-logic';
import type { AccountStore } from '../account-store';

const STATUS: Record<AccountErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'email-taken': 409,
};

const unauthorized = () => new AccountError('unauthorized', 'Sign in to continue.');

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const store = () => strapi.service('api::account.account') as unknown as AccountStore;
  const identify = createIdentify(strapi);

  async function requireUserId(ctx: Context): Promise<number> {
    const identity = await identify(ctx).catch((error) => {
      if (error instanceof CartError && error.code === 'unauthorized') throw unauthorized();
      throw error;
    });
    if (identity.kind !== 'user') throw unauthorized();
    return identity.userId;
  }

  return {
    async updateProfile(ctx: Context) {
      try {
        const userId = await requireUserId(ctx);
        const profile = await store().updateProfile(userId, validateProfile(ctx.request.body));
        ctx.status = 200;
        ctx.body = { profile };
      } catch (error) {
        if (!(error instanceof AccountError)) throw error;
        ctx.status = STATUS[error.code];
        ctx.body = {
          error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) },
        };
      }
    },
  };
};
