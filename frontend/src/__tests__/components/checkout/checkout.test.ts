// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { checkoutTotals, lineMeta, lineNote, shippingPrice, toOrderView } from '@/components/checkout/checkout';
import { makeLine } from '../cart/cart-test-utils';
import { ORDER } from './checkout-fixtures';

describe('checkout view helpers (checkout AC9, AC10, AC12)', () => {
  it('prices the shipping options for the subtotal', () => {
    expect(shippingPrice(74.99, 'standard')).toBe('$12');
    expect(shippingPrice(75, 'standard')).toBe('Free');
    expect(shippingPrice(500, 'express')).toBe('$25');
  });

  it('totals the summary with the chosen method', () => {
    expect(checkoutTotals({ subtotal: '$39.99', subtotalAmount: 39.99 }, 'standard')).toEqual({ subtotal: '$39.99', shipping: '$12', total: '$51.99' });
    expect(checkoutTotals({ subtotal: '$600', subtotalAmount: 600 }, 'standard')).toEqual({ subtotal: '$600', shipping: 'Free', total: '$600' });
    expect(checkoutTotals({ subtotal: '$600', subtotalAmount: 600 }, 'express')).toEqual({ subtotal: '$600', shipping: '$25', total: '$625' });
  });

  it('adds the quantity to the size line only above 1', () => {
    expect(lineMeta('M', 1)).toBe('M');
    expect(lineMeta(`6'0" · 29.9L`, 2)).toBe(`6'0" · 29.9L · Qty 2`);
  });

  it('explains why a line needs attention', () => {
    const none = new Set<string>();
    expect(lineNote(makeLine(), none)).toBeNull();
    expect(lineNote(makeLine({ soldOut: true, blocked: true }), none)).toBe('Sold out');
    expect(lineNote(makeLine({ unavailable: true, blocked: true }), none)).toBe('This size is no longer available.');
    expect(lineNote(makeLine({ adjusted: true, quantity: 2 }), none)).toBe('Only 2 left — quantity updated.');
    expect(lineNote(makeLine(), new Set(['p1:M']))).toBe('Price or quantity updated.');
  });
});

describe('toOrderView (checkout AC15)', () => {
  const view = toOrderView(ORDER);

  it('maps the snapshot lines with their size, quantity and total', () => {
    expect(view.lines).toEqual([
      { key: 'b1:6-0-29.9', name: 'CI Pro', meta: `6'0" · 29.9L`, lineTotal: '$600', image: { src: 'http://localhost:1337/uploads/ci.png', alt: 'CI Pro' } },
      { key: 's1:M', name: 'Samurai', meta: 'M · Qty 2', lineTotal: '$79.98', image: null },
    ]);
  });

  it('formats totals, method, address and payment', () => {
    expect(view).toMatchObject({
      orderNumber: 'WL-104233',
      email: 'jamie@example.com',
      subtotal: '$679.98',
      shippingRow: 'Shipping (Express Shipping)',
      shipping: '$25',
      total: '$704.98',
      shippingMethod: { label: 'Express Shipping', eta: 'Arrives in 2–3 business days' },
      shipTo: ['Jamie Rivera', '1 Ocean Ave', 'Apt 2', 'Santa Cruz, CA 95060', 'United States'],
      payment: 'Visa •••• 4242',
    });
  });

  it('says Free for free shipping and skips an empty second address line', () => {
    const view = toOrderView({ ...ORDER, shippingMethod: 'standard', shippingCost: 0, shippingAddress: { ...ORDER.shippingAddress, address2: null } });
    expect(view.shipping).toBe('Free');
    expect(view.shipTo).toEqual(['Jamie Rivera', '1 Ocean Ave', 'Santa Cruz, CA 95060', 'United States']);
  });
});
