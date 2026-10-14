import { toProductCard, type ProductCard, type StrapiProduct } from '@/shared/components/product-card/product-card';
import { strapiRequest } from './client';

export type WishlistWriteResult = 'ok' | 'unauthorized' | 'not-found' | 'failed';

const auth = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

/** The signed-in shopper's saved products as cards, newest first. Null when the session is rejected or Strapi fails. */
export async function getWishlist(jwt: string): Promise<ProductCard[] | null> {
  const { ok, data } = await strapiRequest('wishlist', { label: 'wishlist', headers: auth(jwt), silentStatuses: [401] });
  const items = (data as { items?: unknown } | null)?.items;
  if (!ok || !Array.isArray(items)) return null;
  return (items as StrapiProduct[]).map((item) => toProductCard(item)).filter((card): card is ProductCard => card !== null);
}

async function write(jwt: string, slug: string, method: 'PUT' | 'DELETE'): Promise<WishlistWriteResult> {
  const { ok, status } = await strapiRequest(`wishlist/items/${encodeURIComponent(slug)}`, {
    label: 'wishlist',
    method,
    headers: auth(jwt),
    silentStatuses: [401, 404],
  });
  if (ok) return 'ok';
  if (status === 401) return 'unauthorized';
  if (status === 404) return 'not-found';
  return 'failed';
}

export const addToWishlist = (jwt: string, slug: string) => write(jwt, slug, 'PUT');

export const removeFromWishlist = (jwt: string, slug: string) => write(jwt, slug, 'DELETE');
