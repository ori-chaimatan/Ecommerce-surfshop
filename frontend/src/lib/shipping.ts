/** Orders at or above this subtotal (USD) ship free with Standard. Shown on product pages, in the cart and at checkout. */
export const FREE_SHIPPING_THRESHOLD = 75;

/**
 * Checkout shipping prices (USD). Display only: cms/src/api/order/shipping.ts computes the
 * charged total, and both sides run the same test cases.
 */
export const STANDARD_SHIPPING = 12;
export const EXPRESS_SHIPPING = 25;

export const SHIPPING_METHODS = ['standard', 'express'] as const;
export type ShippingMethod = (typeof SHIPPING_METHODS)[number];

export function isShippingMethod(value: unknown): value is ShippingMethod {
  return SHIPPING_METHODS.includes(value as ShippingMethod);
}

const cents = (amount: number) => Math.round(amount * 100);

/** Standard is free from the threshold; Express is never free. Compared in cents, like the server. */
export function shippingCost(subtotal: number, method: ShippingMethod): number {
  if (method === 'express') return EXPRESS_SHIPPING;
  return cents(subtotal) >= cents(FREE_SHIPPING_THRESHOLD) ? 0 : STANDARD_SHIPPING;
}
