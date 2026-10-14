import type { Core } from '@strapi/strapi';
import { createCartStore } from '../cart-store';

export default ({ strapi }: { strapi: Core.Strapi }) => createCartStore(strapi);
