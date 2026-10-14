import type { StrapiOrder } from '@/lib/strapi/orders';

type Line = StrapiOrder['lines'][number];

export const line = (extra: Partial<Line> = {}): Line => ({
  productDocumentId: 'shorts-1',
  name: 'Samurai Pro 22" Boardshort',
  slug: 'samurai-pro-22-boardshort',
  sizeKey: 'M',
  sizeLabel: 'M',
  unitPrice: 79,
  quantity: 2,
  lineTotal: 158,
  imageUrl: '/uploads/samurai.jpg',
  imageAlt: 'Samurai boardshort',
  ...extra,
});

export const order = (extra: Partial<StrapiOrder> = {}): StrapiOrder => ({
  orderNumber: 'WL-104233',
  status: 'delivered',
  email: 'jamie@example.com',
  placedAt: '2026-08-22T23:30:00.000Z',
  shippingMethod: 'standard',
  shippingAddress: {
    firstName: 'Jamie',
    lastName: 'Rivera',
    address1: '1 Ocean Ave',
    address2: null,
    city: 'Santa Cruz',
    state: 'CA',
    postalCode: '95060',
    country: 'US',
    phone: null,
  },
  lines: [line(), line({ productDocumentId: 'wax-1', name: 'Surf Wax — 3 Pack', sizeLabel: 'One Size', quantity: 1, unitPrice: 29, lineTotal: 29, imageUrl: null, imageAlt: null })],
  subtotal: 187,
  shippingCost: 0,
  total: 187,
  currency: 'USD',
  payment: { brand: 'visa', last4: '4242' },
  ...extra,
});
