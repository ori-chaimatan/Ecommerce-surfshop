import type { CheckoutFormValues } from '@/lib/checkout/place-order-body';
import type { StrapiOrder } from '@/lib/strapi/orders';

export const ACCOUNT = { email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' };

export const EMPTY_FORM: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  shippingMethod: 'standard',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardName: '',
};

export const FILLED_FORM: CheckoutFormValues = {
  firstName: 'Jamie',
  lastName: 'Rivera',
  address1: '1 Ocean Ave',
  address2: '',
  city: 'Santa Cruz',
  state: 'CA',
  postalCode: '95060',
  phone: '',
  shippingMethod: 'standard',
  cardNumber: '4242 4242 4242 4242',
  cardExpiry: '12/30',
  cardCvc: '123',
  cardName: 'Jamie Rivera',
};

export const ORDER: StrapiOrder = {
  orderNumber: 'WL-104233',
  status: 'processing',
  email: 'jamie@example.com',
  placedAt: '2026-10-11T12:00:00.000Z',
  shippingMethod: 'express',
  shippingAddress: {
    firstName: 'Jamie',
    lastName: 'Rivera',
    address1: '1 Ocean Ave',
    address2: 'Apt 2',
    city: 'Santa Cruz',
    state: 'CA',
    postalCode: '95060',
    country: 'US',
    phone: null,
  },
  lines: [
    { productDocumentId: 'b1', name: 'CI Pro', slug: 'ci-pro', sizeKey: '6-0-29.9', sizeLabel: `6'0" · 29.9L`, unitPrice: 600, quantity: 1, lineTotal: 600, imageUrl: '/uploads/ci.png', imageAlt: null },
    { productDocumentId: 's1', name: 'Samurai', slug: 'samurai', sizeKey: 'M', sizeLabel: 'M', unitPrice: 39.99, quantity: 2, lineTotal: 79.98, imageUrl: null, imageAlt: null },
  ],
  subtotal: 679.98,
  shippingCost: 25,
  total: 704.98,
  currency: 'USD',
  payment: { brand: 'visa', last4: '4242' },
};
