import type { Core } from '@strapi/strapi';
import { WishlistError } from './wishlist-logic';

export const WISHLIST_UID = 'api::wishlist.wishlist-item';
export const PRODUCT_UID = 'api::product.product';

/** The fields the storefront's product card needs (frontend `toProductCard`). */
export interface WishlistProduct {
  Name: string;
  Slug: string;
  Price: number | string;
  Images: { url: string; width: number; height: number }[] | null;
  Category: { Slug: string } | null;
}

interface StoredItem {
  documentId: string;
  Product?: WishlistProduct | null;
}

export interface WishlistStore {
  list(userDocumentId: string): Promise<WishlistProduct[]>;
  add(userDocumentId: string, slug: string): Promise<void>;
  remove(userDocumentId: string, slug: string): Promise<void>;
}

const PRODUCT_POPULATE = {
  Product: {
    fields: ['Name', 'Slug', 'Price'],
    populate: { Images: { fields: ['url', 'width', 'height'] }, Category: { fields: ['Slug'] } },
  },
};

/**
 * The signed-in shopper's saved products. Every call is scoped to the user the controller
 * resolved from the JWT; nothing here accepts a user from the request.
 */
export function createWishlistStore(strapi: Core.Strapi): WishlistStore {
  const items = () =>
    strapi.documents(WISHLIST_UID as never) as unknown as {
      findMany(params: object): Promise<StoredItem[]>;
      findFirst(params: object): Promise<StoredItem | null>;
      create(params: object): Promise<unknown>;
      delete(params: { documentId: string }): Promise<unknown>;
    };
  const products = () =>
    strapi.documents(PRODUCT_UID as never) as unknown as {
      findFirst(params: object): Promise<{ documentId: string } | null>;
    };

  return {
    async list(userDocumentId) {
      const stored = await items().findMany({
        filters: { User: { documentId: userDocumentId } },
        sort: 'createdAt:desc',
        populate: PRODUCT_POPULATE,
      });

      const seen = new Set<string>();
      const result: WishlistProduct[] = [];
      for (const item of stored) {
        // The product was deleted: the relation is gone, so the row is dead weight.
        if (!item.Product) {
          await items().delete({ documentId: item.documentId });
          continue;
        }
        if (seen.has(item.Product.Slug)) continue;
        seen.add(item.Product.Slug);
        const { Name, Slug, Price, Images, Category } = item.Product;
        result.push({ Name, Slug, Price, Images, Category });
      }
      return result;
    },

    async add(userDocumentId, slug) {
      const product = await products().findFirst({ filters: { Slug: slug }, fields: ['Slug'] });
      if (!product) throw new WishlistError('not-found', 'Product not found.');

      const existing = await items().findFirst({
        filters: { User: { documentId: userDocumentId }, Product: { documentId: product.documentId } },
        fields: [],
      });
      if (!existing) await items().create({ data: { User: userDocumentId, Product: product.documentId } });
    },

    async remove(userDocumentId, slug) {
      const saved = await items().findMany({
        filters: { User: { documentId: userDocumentId }, Product: { Slug: slug } },
        fields: [],
      });
      for (const item of saved) await items().delete({ documentId: item.documentId });
    },
  };
}
