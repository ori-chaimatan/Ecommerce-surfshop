import type { StrapiCart } from '@/lib/strapi/cart';

export const STRAPI_CART: StrapiCart = {
  removedCount: 0,
  lines: [
    {
      productDocumentId: 's1',
      slug: 'samurai',
      name: 'Samurai',
      price: 79,
      sizeType: 'Standard',
      sizeKey: 'M',
      size: { Size: 'M' },
      quantity: 2,
      stock: 24,
      image: null,
      soldOut: false,
      unavailable: false,
      adjusted: false,
    },
  ],
};

export const strapiJson = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
