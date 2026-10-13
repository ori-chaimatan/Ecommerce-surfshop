import { factories } from '@strapi/strapi';

const noProductsPopulate = { middlewares: ['global::no-products-populate'] };

export default factories.createCoreRouter('api::product.product', {
  config: { find: noProductsPopulate, findOne: noProductsPopulate },
});
