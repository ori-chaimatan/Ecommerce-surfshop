import type { Core } from '@strapi/strapi';
import { createWishlistStore } from '../wishlist-store';

export default ({ strapi }: { strapi: Core.Strapi }) => createWishlistStore(strapi);
