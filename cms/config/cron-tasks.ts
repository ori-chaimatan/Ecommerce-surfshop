import type { Core } from '@strapi/strapi';

/** Scheduled jobs, enabled in server.ts. */
export default {
  /** Daily at 03:00: removes guest carts nobody has touched for 30 days (cart-checkout AC19). */
  purgeAbandonedGuestCarts: {
    task: async ({ strapi }: { strapi: Core.Strapi }) => {
      const store = strapi.service('api::cart.cart') as unknown as { purgeAbandoned(now: Date): Promise<number> };
      const deleted = await store.purgeAbandoned(new Date());
      strapi.log.info(`[cart purge] deleted ${deleted} abandoned guest carts`);
    },
    options: { rule: '0 3 * * *' },
  },
};
