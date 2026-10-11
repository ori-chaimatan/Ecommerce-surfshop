import type { Core } from '@strapi/strapi';
import type { Context } from 'koa';
import { CartError } from '../../cart/cart-logic';
import type { CartIdentity } from '../../cart/cart-store';
import { createIdentify } from '../../cart/identity';
import { sendOrderEmail } from '../order-email';
import { OrderError, validatePlaceOrder, type OrderErrorCode } from '../order-logic';
import type { OrderStore } from '../order-store';

const STATUS: Record<OrderErrorCode, number> = {
  'bad-request': 400,
  unauthorized: 401,
  'not-found': 404,
  'cart-empty': 409,
  'cart-changed': 409,
  'card-declined': 402,
  'payment-error': 502,
};

const unauthorized = () => new OrderError('unauthorized', 'Sign in to continue.');
/** One response for unknown and not-yours, so order numbers can't be probed. */
const notFound = () => new OrderError('not-found', 'Order not found.');

export default ({ strapi }: { strapi: Core.Strapi }) => {
  const store = () => strapi.service('api::order.order') as unknown as OrderStore;
  const identify = createIdentify(strapi);

  async function requireUser(ctx: Context): Promise<Extract<CartIdentity, { kind: 'user' }>> {
    const identity = await identify(ctx).catch((error) => {
      if (error instanceof CartError && error.code === 'unauthorized') throw unauthorized();
      throw error;
    });
    if (identity.kind !== 'user') throw unauthorized();
    return identity;
  }

  async function respond(ctx: Context, run: () => Promise<{ status: number; body: unknown }>) {
    try {
      const result = await run();
      ctx.status = result.status;
      ctx.body = result.body;
    } catch (error) {
      if (!(error instanceof OrderError)) throw error;
      ctx.status = STATUS[error.code];
      ctx.body = {
        error: {
          code: error.code,
          message: error.message,
          ...(error.fields ? { fields: error.fields } : {}),
          ...(error.lineKeys ? { lineKeys: error.lineKeys } : {}),
        },
      };
    }
  }

  return {
    place: (ctx: Context) =>
      respond(ctx, async () => {
        const user = await requireUser(ctx);
        const input = validatePlaceOrder(ctx.request.body, new Date());
        const { replayed, order } = await store().place(user, input);
        // After commit only; a replay already sent its email. Fire-and-forget: SMTP takes
        // ~1s warm and several seconds cold, so the shopper never waits for it.
        if (!replayed) {
          sendOrderEmail(strapi, order).catch((error) =>
            strapi.log.error(`[order email] failed to send ${order.orderNumber}`, error)
          );
        }
        return { status: replayed ? 200 : 201, body: { order } };
      }),

    findOne: (ctx: Context) =>
      respond(ctx, async () => {
        const user = await requireUser(ctx);
        const order = await store().findByNumber(user, String(ctx.params.orderNumber ?? ''));
        if (!order) throw notFound();
        return { status: 200, body: { order } };
      }),
  };
};
