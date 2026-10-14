// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EXPRESS_SHIPPING, FREE_SHIPPING_THRESHOLD, STANDARD_SHIPPING, isShippingMethod, shippingCost } from '@/lib/shipping';

// The same cases (in cents) run against cms/src/api/order/shipping.ts (cms/tests/order/shipping.test.ts).
const CASES: [number, 'standard' | 'express', number][] = [
  [0, 'standard', 12],
  [74.99, 'standard', 12],
  [75, 'standard', 0],
  [200, 'standard', 0],
  [0, 'express', 25],
  [75, 'express', 25],
  [200, 'express', 25],
];

describe('shipping (checkout AC10)', () => {
  it('keeps the free-shipping threshold and prices both methods', () => {
    expect(FREE_SHIPPING_THRESHOLD).toBe(75);
    expect(STANDARD_SHIPPING).toBe(12);
    expect(EXPRESS_SHIPPING).toBe(25);
  });

  it.each(CASES)('subtotal $%s with %s costs $%s', (subtotal, method, cost) => {
    expect(shippingCost(subtotal, method)).toBe(cost);
  });

  it('is exact in cents for fractional subtotals', () => {
    expect(shippingCost(0.1 + 0.2 + 74.7, 'standard')).toBe(0); // 75.00000000000001 → 7500¢
    expect(shippingCost(0.1 + 74.8, 'standard')).toBe(12);
  });

  it('recognises only standard and express', () => {
    expect(isShippingMethod('standard')).toBe(true);
    expect(isShippingMethod('express')).toBe(true);
    expect(isShippingMethod('overnight')).toBe(false);
  });
});
