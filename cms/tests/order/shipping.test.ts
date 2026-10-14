import { describe, expect, it } from 'vitest';
import {
  EXPRESS_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  STANDARD_SHIPPING_CENTS,
  isShippingMethod,
  shippingCost,
} from '../../src/api/order/shipping';

// The same cases run against frontend/src/lib/shipping.ts (frontend/src/__tests__/lib/shipping.test.ts).
const CASES: [number, 'standard' | 'express', number][] = [
  [0, 'standard', 1200],
  [7499, 'standard', 1200],
  [7500, 'standard', 0],
  [20000, 'standard', 0],
  [0, 'express', 2500],
  [7500, 'express', 2500],
  [20000, 'express', 2500],
];

describe('shipping (AC10)', () => {
  it('prices Standard at $12, free from $75, and Express at $25', () => {
    expect(STANDARD_SHIPPING_CENTS).toBe(1200);
    expect(EXPRESS_SHIPPING_CENTS).toBe(2500);
    expect(FREE_SHIPPING_THRESHOLD_CENTS).toBe(7500);
  });

  it.each(CASES)('subtotal %i¢ with %s costs %i¢', (subtotal, method, cost) => {
    expect(shippingCost(subtotal, method)).toBe(cost);
  });

  it('throws on an unknown method', () => {
    expect(() => shippingCost(1000, 'overnight' as never)).toThrow();
  });

  it('recognises only standard and express', () => {
    expect(isShippingMethod('standard')).toBe(true);
    expect(isShippingMethod('express')).toBe(true);
    expect(isShippingMethod('overnight')).toBe(false);
    expect(isShippingMethod(undefined)).toBe(false);
  });
});
