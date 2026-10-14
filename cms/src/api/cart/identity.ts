import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError } from './cart-logic';
import type { CartIdentity } from './cart-store';

const USER_UID = 'plugin::users-permissions.user';
export const TOKEN_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const unauthorized = () => new CartError('unauthorized', 'Invalid or expired session.');

/**
 * Resolves who a request is for. Shared by the cart and order controllers, whose routes are
 * `auth: false`: a Bearer JWT wins (and must be valid); otherwise a well-formed guest token;
 * otherwise nobody.
 */
export function createIdentify(strapi: Core.Strapi) {
  return async function identify(ctx: Context): Promise<CartIdentity> {
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
      return { kind: 'user', userId: user.id, userDocumentId: user.documentId, email: user.email };
    }

    const token = ctx.request.header['x-cart-token'];
    return typeof token === 'string' && TOKEN_PATTERN.test(token) ? { kind: 'guest', token } : { kind: 'none' };
  };
}
