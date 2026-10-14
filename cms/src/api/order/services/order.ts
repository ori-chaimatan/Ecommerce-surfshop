import type { Core } from '@strapi/strapi';
import { createCartStore } from '../../cart/cart-store';
import { createOrderStore } from '../order-store';

export default ({ strapi }: { strapi: Core.Strapi }) => createOrderStore(strapi, { cartStore: createCartStore(strapi) });
