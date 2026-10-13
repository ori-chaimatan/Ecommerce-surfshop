import { factories } from '@strapi/strapi';

const noProductsPopulate = { middlewares: ['global::no-products-populate'] };

export default factories.createCoreRouter('api::category.category', {
  config: { find: noProductsPopulate, findOne: noProductsPopulate },
});
