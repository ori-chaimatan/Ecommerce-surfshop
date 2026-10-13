import type { Core } from '@strapi/strapi';
import { populatesProducts } from '../utils/catalog-relations';

/**
 * Route middleware on the catalog find / findOne routes: a request that populates `Products`
 * (or `*`) is rejected, so one request can't pull the whole catalog with stock through the
 * inverse relations. The storefront queries /api/products with filters instead.
 */
export default (_config: unknown, _ctx: { strapi: Core.Strapi }) => {
  return async (ctx: { query?: { populate?: unknown }; badRequest: (message: string) => void }, next: () => Promise<void>) => {
    if (populatesProducts(ctx.query?.populate)) {
      return ctx.badRequest('Populating Products (or *) is not allowed here. Query /api/products with filters instead.');
    }
    await next();
  };
};
