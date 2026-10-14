// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { toPlaceOrderBody } from '@/lib/checkout/place-order-body';

const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';

const form = {
  firstName: ' Jamie ',
  lastName: 'Rivera',
  address1: '1 Ocean Ave',
  address2: '',
  city: 'Santa Cruz',
  state: 'CA',
  postalCode: '95060',
  phone: '',
  shippingMethod: 'standard' as const,
  cardNumber: '4242 4242 4242 4242',
  cardExpiry: '12/30',
  cardCvc: '123',
  cardName: 'Jamie Rivera',
};

const cart = {
  lines: [
    { productDocumentId: 'b1', sizeKey: '6-0-29.9', quantity: 1, unitAmount: 600 },
    { productDocumentId: 's1', sizeKey: 'M', quantity: 2, unitAmount: 24.5 },
  ],
  subtotalAmount: 649,
};

describe('toPlaceOrderBody (checkout AC3, AC4)', () => {
  it('maps the form and the reviewed cart to the API body', () => {
    expect(toPlaceOrderBody(form, cart, KEY)).toEqual({
      idempotencyKey: KEY,
      shipping: {
        firstName: 'Jamie',
        lastName: 'Rivera',
        address1: '1 Ocean Ave',
        address2: '',
        city: 'Santa Cruz',
        state: 'CA',
        postalCode: '95060',
        phone: '',
      },
      shippingMethod: 'standard',
      card: { number: '4242424242424242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' },
      expected: {
        total: 649,
        lines: [
          { productDocumentId: 'b1', sizeKey: '6-0-29.9', quantity: 1, unitPrice: 600 },
          { productDocumentId: 's1', sizeKey: 'M', quantity: 2, unitPrice: 24.5 },
        ],
      },
    });
  });

  it('adds the shipping the shopper saw to the expected total', () => {
    const small = { lines: [{ productDocumentId: 's1', sizeKey: 'M', quantity: 1, unitAmount: 24.5 }], subtotalAmount: 24.5 };
    expect(toPlaceOrderBody(form, small, KEY).expected.total).toBe(36.5);
    expect(toPlaceOrderBody({ ...form, shippingMethod: 'express' }, small, KEY).expected.total).toBe(49.5);
  });

  it('keeps cents exact', () => {
    const odd = { lines: [{ productDocumentId: 's1', sizeKey: 'M', quantity: 3, unitAmount: 0.1 }], subtotalAmount: 0.30000000000000004 };
    expect(toPlaceOrderBody(form, odd, KEY).expected.total).toBe(12.3);
  });

  it('leaves an unparsable expiry for validation to catch', () => {
    const { card } = toPlaceOrderBody({ ...form, cardExpiry: '1/3' }, cart, KEY);
    expect(card.expMonth).toBeNaN();
    expect(card.expYear).toBeNaN();
  });
});
