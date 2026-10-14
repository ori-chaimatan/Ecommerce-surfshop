/**
 * Shipping rules, in integer cents. Authoritative: the place-order total is computed here.
 * frontend/src/lib/shipping.ts mirrors these numbers for display and runs the same test cases.
 */

export const SHIPPING_METHODS = ['standard', 'express'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export const FREE_SHIPPING_THRESHOLD_CENTS = 7500;
export const STANDARD_SHIPPING_CENTS = 1200;
export const EXPRESS_SHIPPING_CENTS = 2500;

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return SHIPPING_METHODS.includes(value as ShippingMethod);
}

/** Standard is free from the threshold; Express is never free. */
export function shippingCost(subtotalCents: number, method: ShippingMethod): number {
  if (method === 'standard') return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
  if (method === 'express') return EXPRESS_SHIPPING_CENTS;
  throw new Error(`Unknown shipping method: ${String(method)}`);
}
