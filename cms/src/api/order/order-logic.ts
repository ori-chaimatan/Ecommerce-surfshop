/**
 * Pure order rules: request validation, the cart-vs-review comparison, totals in cents and
 * the snapshot written to the Order. No Strapi calls here — order-store.ts does the reads,
 * the stock decrement and the writes.
 */

import { randomInt } from 'node:crypto';
import type { CartResponse } from '../cart/cart-logic';
import { sizeLabel, type RawSize } from './format';
import { validateCard, type CardBrand, type CardInput } from './mock-payment';
import { isShippingMethod, shippingCost, type ShippingMethod } from './shipping';

export type OrderErrorCode =
  | 'bad-request'
  | 'unauthorized'
  | 'not-found'
  | 'cart-empty'
  | 'cart-changed'
  | 'card-declined'
  | 'payment-error';

export class OrderError extends Error {
  constructor(
    readonly code: OrderErrorCode,
    message: string = code,
    readonly fields?: Record<string, string>,
    readonly lineKeys?: string[]
  ) {
    super(message);
  }
}

export const ORDER_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'] as const;

export const US_STATES = [
  ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'],
  ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['DC', 'District of Columbia'], ['FL', 'Florida'],
  ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'],
  ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'],
  ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'],
  ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'],
  ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'],
  ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'],
  ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'],
  ['WY', 'Wyoming'],
].map(([code, name]) => ({ code, name }));

const STATE_CODES = new Set(US_STATES.map((state) => state.code));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ZIP = /^\d{5}(-\d{4})?$/;
const MAX_EXPECTED_LINES = 100;

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface ExpectedLine {
  productDocumentId: string;
  sizeKey: string;
  quantity: number;
  unitPrice: number;
}

export interface PlaceOrderInput {
  idempotencyKey: string;
  shipping: ShippingAddress;
  shippingMethod: ShippingMethod;
  card: CardInput;
  expected: { total: number; lines: ExpectedLine[] };
}

export interface Totals {
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
}

export const toCents = (amount: number | string) => Math.round(Number(amount) * 100);
const fromCents = (cents: number) => cents / 100;

export const lineKey = (productDocumentId: string, sizeKey: string) => `${productDocumentId}:${sizeKey}`;

/** `WL-` + 6 digits. Random, so it isn't guessable from the DB id; the store retries collisions. */
export function orderNumber(n: number = randomInt(100000, 1000000)): string {
  return `WL-${n}`;
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

function validateShipping(input: unknown, fields: Record<string, string>): ShippingAddress {
  const raw = (input ?? {}) as Record<string, unknown>;
  const required = (key: keyof ShippingAddress, label: string, max: number) => {
    const value = text(raw[key]);
    if (!value) fields[key] = `Enter your ${label}.`;
    else if (value.length > max) fields[key] = `Use at most ${max} characters.`;
    return value;
  };

  const address = {
    firstName: required('firstName', 'first name', 50),
    lastName: required('lastName', 'last name', 50),
    address1: required('address1', 'address', 100),
    address2: text(raw.address2),
    city: required('city', 'city', 60),
    state: text(raw.state),
    postalCode: text(raw.postalCode),
    phone: '',
  };

  if (address.address2.length > 100) fields.address2 = 'Use at most 100 characters.';
  if (!STATE_CODES.has(address.state)) fields.state = 'Select a state.';
  if (!ZIP.test(address.postalCode)) fields.postalCode = 'Enter a 5-digit ZIP code.';

  const phoneDigits = text(raw.phone).replace(/\D/g, '');
  if (phoneDigits) {
    const national = phoneDigits.length === 11 && phoneDigits.startsWith('1') ? phoneDigits.slice(1) : phoneDigits;
    if (national.length === 10) address.phone = national;
    else fields.phone = 'Enter a 10-digit phone number.';
  }

  return address;
}

function validateExpected(input: unknown): PlaceOrderInput['expected'] | null {
  const { total, lines } = (input ?? {}) as Record<string, unknown>;
  if (!isFiniteNumber(total) || total < 0 || !Array.isArray(lines) || lines.length > MAX_EXPECTED_LINES) return null;

  const parsed: ExpectedLine[] = [];
  for (const line of lines) {
    const { productDocumentId, sizeKey, quantity, unitPrice } = (line ?? {}) as Record<string, unknown>;
    if (
      typeof productDocumentId !== 'string' ||
      typeof sizeKey !== 'string' ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      !isFiniteNumber(unitPrice)
    ) {
      return null;
    }
    parsed.push({ productDocumentId, sizeKey, quantity: quantity as number, unitPrice });
  }
  return { total, lines: parsed };
}

/** Validates a place-order body, collecting every field error; throws `bad-request` with `fields`. */
export function validatePlaceOrder(body: unknown, now: Date): PlaceOrderInput {
  if (!body || typeof body !== 'object') throw new OrderError('bad-request', 'Invalid request.');
  const raw = body as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const idempotencyKey = text(raw.idempotencyKey);
  if (!UUID.test(idempotencyKey)) fields.idempotencyKey = 'A checkout key is required.';

  const shipping = validateShipping(raw.shipping, fields);

  if (!isShippingMethod(raw.shippingMethod)) fields.shippingMethod = 'Choose a shipping method.';

  Object.assign(fields, validateCard(raw.card, now));

  const expected = validateExpected(raw.expected);
  if (!expected) fields.expected = 'The order review is missing.';

  if (Object.keys(fields).length > 0) throw new OrderError('bad-request', 'Check the highlighted fields.', fields);

  const card = raw.card as CardInput;
  return {
    idempotencyKey,
    shipping,
    shippingMethod: raw.shippingMethod as ShippingMethod,
    card: { ...card, name: card.name.trim() },
    expected: expected!,
  };
}

/**
 * Compares the live (re-validated) cart with what the shopper reviewed. Any difference in
 * lines, quantities, unit prices or the total, and any flagged or pruned line, means the
 * shopper must review again. Returns the server-computed totals.
 */
export function compareWithExpected(
  cart: CartResponse,
  expected: PlaceOrderInput['expected'],
  method: ShippingMethod
): Totals {
  if (cart.lines.length === 0) throw new OrderError('cart-empty', 'Your cart is empty.');

  const changedKeys: string[] = [];
  const shown = new Map(expected.lines.map((line) => [lineKey(line.productDocumentId, line.sizeKey), line]));

  for (const line of cart.lines) {
    const key = lineKey(line.productDocumentId, line.sizeKey);
    const seen = shown.get(key);
    shown.delete(key);
    if (
      !seen ||
      line.soldOut ||
      line.unavailable ||
      line.adjusted ||
      seen.quantity !== line.quantity ||
      toCents(seen.unitPrice) !== toCents(line.price)
    ) {
      changedKeys.push(key);
    }
  }
  changedKeys.push(...shown.keys());

  const subtotalCents = cart.lines.reduce((sum, line) => sum + toCents(line.price) * line.quantity, 0);
  const shippingCents = shippingCost(subtotalCents, method);
  const totalCents = subtotalCents + shippingCents;

  if (changedKeys.length > 0 || cart.removedCount > 0 || toCents(expected.total) !== totalCents) {
    throw new OrderError('cart-changed', 'Your cart changed. Review it and place your order again.', undefined, changedKeys);
  }

  return { subtotalCents, shippingCents, totalCents };
}

export interface SnapshotArgs {
  orderNumber: string;
  user: { documentId: string; email: string };
  cart: CartResponse;
  input: PlaceOrderInput;
  totals: Totals;
  payment: { brand: CardBrand; last4: string; reference: string };
  now: Date;
}

/** The Order document data: everything shown later comes from here, never from live products. */
export function buildOrderSnapshot({ orderNumber: number, user, cart, input, totals, payment, now }: SnapshotArgs) {
  const { shipping } = input;
  return {
    OrderNumber: number,
    Status: 'processing' as const,
    User: user.documentId,
    Email: user.email,
    ShippingAddress: {
      FirstName: shipping.firstName,
      LastName: shipping.lastName,
      Address1: shipping.address1,
      Address2: shipping.address2,
      City: shipping.city,
      State: shipping.state,
      PostalCode: shipping.postalCode,
      Country: 'US',
      Phone: shipping.phone,
    },
    ShippingMethod: input.shippingMethod,
    Lines: cart.lines.map((line) => ({
      Product: line.productDocumentId,
      ProductDocumentId: line.productDocumentId,
      Name: line.name,
      Slug: line.slug,
      SizeKey: line.sizeKey,
      SizeLabel: line.size ? sizeLabel(line.size as RawSize) : line.sizeKey,
      UnitPrice: fromCents(toCents(line.price)),
      Quantity: line.quantity,
      LineTotal: fromCents(toCents(line.price) * line.quantity),
      ImageUrl: line.image?.url ?? null,
      ImageAlt: line.image?.alternativeText ?? null,
    })),
    Subtotal: fromCents(totals.subtotalCents),
    ShippingCost: fromCents(totals.shippingCents),
    Total: fromCents(totals.totalCents),
    Currency: 'USD',
    PaymentBrand: payment.brand,
    PaymentLast4: payment.last4,
    PaymentReference: payment.reference,
    IdempotencyKey: input.idempotencyKey,
    PlacedAt: now.toISOString(),
  };
}

export type OrderSnapshot = ReturnType<typeof buildOrderSnapshot>;

/** A stored Order as the document service returns it (decimals may come back as strings). */
export interface StoredOrder {
  OrderNumber: string;
  Status: string;
  Email: string;
  ShippingMethod: string;
  ShippingAddress?: Record<string, string | null> | null;
  Lines?: Record<string, string | number | null>[] | null;
  Subtotal: number | string;
  ShippingCost: number | string;
  Total: number | string;
  Currency: string;
  PaymentBrand: string;
  PaymentLast4: string;
  PlacedAt: string;
  [key: string]: unknown;
}

const amount = (value: unknown) => fromCents(toCents(value as number | string));

/** The owner's view of an order: no DB ids, idempotency key or payment reference. */
export function toOrderResponse(order: StoredOrder) {
  const address = order.ShippingAddress ?? {};
  return {
    orderNumber: order.OrderNumber,
    status: order.Status,
    email: order.Email,
    placedAt: order.PlacedAt,
    shippingMethod: order.ShippingMethod,
    shippingAddress: {
      firstName: address.FirstName ?? '',
      lastName: address.LastName ?? '',
      address1: address.Address1 ?? '',
      address2: address.Address2 ?? null,
      city: address.City ?? '',
      state: address.State ?? '',
      postalCode: address.PostalCode ?? '',
      country: address.Country ?? 'US',
      phone: address.Phone ?? null,
    },
    lines: (order.Lines ?? []).map((line) => ({
      productDocumentId: line.ProductDocumentId as string,
      name: line.Name as string,
      slug: line.Slug as string,
      sizeKey: line.SizeKey as string,
      sizeLabel: line.SizeLabel as string,
      unitPrice: amount(line.UnitPrice),
      quantity: Number(line.Quantity),
      lineTotal: amount(line.LineTotal),
      imageUrl: (line.ImageUrl as string | null) ?? null,
      imageAlt: (line.ImageAlt as string | null) ?? null,
    })),
    subtotal: amount(order.Subtotal),
    shippingCost: amount(order.ShippingCost),
    total: amount(order.Total),
    currency: order.Currency,
    payment: { brand: order.PaymentBrand, last4: order.PaymentLast4 },
  };
}

export type OrderResponse = ReturnType<typeof toOrderResponse>;
