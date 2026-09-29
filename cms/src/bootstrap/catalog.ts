import type { Core } from '@strapi/strapi';
import { grantPublicActions } from './public-permissions';

const PUBLIC_ACTIONS = [
  'api::product.product.find',
  'api::product.product.findOne',
  'api::category.category.find',
  'api::category.category.findOne',
  'api::subcategory.subcategory.find',
  'api::subcategory.subcategory.findOne',
];

export async function setupCatalog(strapi: Core.Strapi) {
  await grantPublicActions(strapi, PUBLIC_ACTIONS, 'catalog');
}
