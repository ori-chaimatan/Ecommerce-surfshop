import type { CartLineView, CartView } from '@/components/cart/cart';
import { shippingCost, type ShippingMethod } from '@/lib/shipping';
import { strapiMediaUrl } from '@/lib/strapi/media';
import type { StrapiOrder } from '@/lib/strapi/orders';
import { formatPrice } from '@/shared/components/product-card/product-card';
import { texts } from './checkout-texts';

export const SHIPPING_OPTIONS: { method: ShippingMethod; label: string; eta: string }[] = [
  { method: 'standard', label: texts.standardShipping, eta: texts.standardEta },
  { method: 'express', label: texts.expressShipping, eta: texts.expressEta },
];

const BRANDS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'American Express' };

const cents = (amount: number) => Math.round(amount * 100);
const shippingLabel = (amount: number) => (amount === 0 ? texts.free : formatPrice(amount));

/** The price shown on a shipping option for this subtotal: "Free" or "$12". */
export function shippingPrice(subtotalAmount: number, method: ShippingMethod) {
  return shippingLabel(shippingCost(subtotalAmount, method));
}

/** Summary rows for the cart being reviewed with the chosen method. */
export function checkoutTotals(cart: Pick<CartView, 'subtotal' | 'subtotalAmount'>, method: ShippingMethod) {
  const shipping = shippingCost(cart.subtotalAmount, method);
  return {
    subtotal: cart.subtotal,
    shipping: shippingLabel(shipping),
    total: formatPrice((cents(cart.subtotalAmount) + cents(shipping)) / 100),
  };
}

/** The size line under a summary row: "M" or "M · Qty 2". */
export function lineMeta(sizeLabel: string, quantity: number) {
  return quantity > 1 ? `${sizeLabel}${texts.quantity(quantity)}` : sizeLabel;
}

/** Why a reviewed line needs attention, if it does (after a refused order or a cart reload). */
export function lineNote(line: CartLineView, changedKeys: ReadonlySet<string>): string | null {
  if (line.soldOut) return texts.soldOut;
  if (line.unavailable) return texts.unavailable;
  if (line.adjusted) return texts.adjusted(line.quantity);
  return changedKeys.has(line.key) ? texts.changed : null;
}

export interface OrderView {
  orderNumber: string;
  email: string;
  lines: { key: string; name: string; meta: string; lineTotal: string; image: { src: string; alt: string } | null }[];
  subtotal: string;
  shippingRow: string;
  shipping: string;
  total: string;
  shippingMethod: { label: string; eta: string };
  shipTo: string[];
  payment: string;
}

/** The confirmation page view: everything from the order's snapshot, never live products. */
export function toOrderView(order: StrapiOrder): OrderView {
  const method = SHIPPING_OPTIONS.find((option) => option.method === order.shippingMethod) ?? {
    label: order.shippingMethod,
    eta: '',
  };
  const address = order.shippingAddress;

  return {
    orderNumber: order.orderNumber,
    email: order.email,
    lines: order.lines.map((line) => ({
      key: `${line.productDocumentId}:${line.sizeKey}`,
      name: line.name,
      meta: lineMeta(line.sizeLabel, line.quantity),
      lineTotal: formatPrice(line.lineTotal),
      image: line.imageUrl ? { src: strapiMediaUrl(line.imageUrl), alt: line.imageAlt ?? line.name } : null,
    })),
    subtotal: formatPrice(order.subtotal),
    shippingRow: texts.shippingWithMethod(method.label),
    shipping: shippingLabel(order.shippingCost),
    total: formatPrice(order.total),
    shippingMethod: { label: method.label, eta: method.eta },
    shipTo: [
      `${address.firstName} ${address.lastName}`,
      address.address1,
      ...(address.address2 ? [address.address2] : []),
      `${address.city}, ${address.state} ${address.postalCode}`,
      texts.unitedStates,
    ],
    payment: `${BRANDS[order.payment.brand] ?? order.payment.brand} •••• ${order.payment.last4}`,
  };
}
