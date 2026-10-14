/**
 * Checkout validation, shared by the form (client) and the place-order route (server). It
 * mirrors cms/src/api/order (order-logic.ts, mock-payment.ts), which re-validates everything.
 */
import { isShippingMethod, type ShippingMethod } from '@/lib/shipping';
import { texts } from './validate-texts';

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

/** Every form field, in visual order — the first one with an error takes focus. */
export const CHECKOUT_FIELDS = [
  'firstName',
  'lastName',
  'address1',
  'address2',
  'city',
  'state',
  'postalCode',
  'phone',
  'shippingMethod',
  'cardNumber',
  'cardExpiry',
  'cardCvc',
  'cardName',
] as const;
export type CheckoutField = (typeof CHECKOUT_FIELDS)[number];

export type FieldErrors = Partial<Record<CheckoutField | 'idempotencyKey' | 'expected', string>>;

export type CardBrand = 'visa' | 'mastercard' | 'amex';

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

export interface PlaceOrderBody {
  idempotencyKey: string;
  shipping: ShippingAddress;
  shippingMethod: ShippingMethod;
  card: { number: string; expMonth: number; expYear: number; cvc: string; name: string };
  expected: { total: number; lines: { productDocumentId: string; sizeKey: string; quantity: number; unitPrice: number }[] };
}

const STATE_CODES = new Set(US_STATES.map((state) => state.code));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ZIP = /^\d{5}(-\d{4})?$/;
const MAX_YEARS_AHEAD = 20;

const digitsOf = (value: string) => value.replace(/\D/g, '');
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export function luhn(number: string): boolean {
  const digits = digitsOf(number);
  if (!/^\d{12,19}$/.test(digits)) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function cardBrand(number: string): CardBrand | null {
  const digits = digitsOf(number);
  if (/^4/.test(digits)) return 'visa';
  if (/^3[47]/.test(digits)) return 'amex';
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  const prefix = Number(digits.slice(0, 4));
  return prefix >= 2221 && prefix <= 2720 ? 'mastercard' : null;
}

/** Groups digits as typed: 4-4-4-4(-3) for most cards, 4-6-5 for Amex. */
export function formatCardNumber(input: string): string {
  const digits = digitsOf(input).slice(0, 19);
  const groups = cardBrand(digits) === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts: string[] = [];
  let start = 0;
  for (const size of groups) {
    if (start >= digits.length) break;
    parts.push(digits.slice(start, start + size));
    start += size;
  }
  return parts.join(' ');
}

/** `1230` → `12/30` as typed. */
export function formatExpiry(input: string): string {
  const digits = digitsOf(input).slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

export function parseExpiry(value: string): { expMonth: number; expYear: number } | null {
  const match = /^(\d{2})\s*\/\s*(\d{2})$/.exec(value.trim());
  return match ? { expMonth: Number(match[1]), expYear: 2000 + Number(match[2]) } : null;
}

function validateShipping(raw: Record<string, unknown>, errors: FieldErrors) {
  const required = (key: keyof ShippingAddress, label: string, max: number) => {
    const value = text(raw[key]);
    if (!value) errors[key] = texts.required(label);
    else if (value.length > max) errors[key] = texts.tooLong(max);
  };

  required('firstName', 'first name', 50);
  required('lastName', 'last name', 50);
  required('address1', 'address', 100);
  if (text(raw.address2).length > 100) errors.address2 = texts.tooLong(100);
  required('city', 'city', 60);
  if (!STATE_CODES.has(text(raw.state))) errors.state = texts.state;
  if (!ZIP.test(text(raw.postalCode))) errors.postalCode = texts.postalCode;

  const phone = digitsOf(text(raw.phone));
  const national = phone.length === 11 && phone.startsWith('1') ? phone.slice(1) : phone;
  if (phone && national.length !== 10) errors.phone = texts.phone;
}

function validateCard(raw: Record<string, unknown>, now: Date, errors: FieldErrors) {
  const number = typeof raw.number === 'string' ? raw.number : '';
  const brand = cardBrand(number);
  if (!luhn(number)) errors.cardNumber = texts.cardNumber;
  else if (!brand) errors.cardNumber = texts.cardUnsupported;

  const { expMonth, expYear } = raw;
  const validExpiry =
    Number.isInteger(expMonth) &&
    Number.isInteger(expYear) &&
    (expMonth as number) >= 1 &&
    (expMonth as number) <= 12 &&
    (expYear as number) * 12 + (expMonth as number) - 1 >= now.getUTCFullYear() * 12 + now.getUTCMonth() &&
    (expYear as number) <= now.getUTCFullYear() + MAX_YEARS_AHEAD;
  if (!validExpiry) errors.cardExpiry = texts.cardExpiry;

  const cvcLength = brand === 'amex' ? 4 : 3;
  if (typeof raw.cvc !== 'string' || !new RegExp(`^\\d{${cvcLength}}$`).test(raw.cvc)) errors.cardCvc = texts.cardCvc(cvcLength);

  const name = text(raw.name);
  if (!name || name.length > 100) errors.cardName = texts.cardName;
}

function validExpected(raw: unknown): boolean {
  const { total, lines } = (raw ?? {}) as Record<string, unknown>;
  return (
    typeof total === 'number' &&
    Number.isFinite(total) &&
    Array.isArray(lines) &&
    lines.every((line) => {
      const { productDocumentId, sizeKey, quantity, unitPrice } = (line ?? {}) as Record<string, unknown>;
      return (
        typeof productDocumentId === 'string' &&
        typeof sizeKey === 'string' &&
        Number.isInteger(quantity) &&
        (quantity as number) >= 1 &&
        typeof unitPrice === 'number'
      );
    })
  );
}

/** Field errors keyed by form field, in form order; `ok` with the body when there are none. */
export function validatePlaceOrderBody(
  value: unknown,
  now: Date
): { ok: true; body: PlaceOrderBody } | { ok: false; fields: FieldErrors } {
  if (!value || typeof value !== 'object') return { ok: false, fields: {} };
  const raw = value as Record<string, unknown>;
  const errors: FieldErrors = {};

  validateShipping((raw.shipping ?? {}) as Record<string, unknown>, errors);
  if (!isShippingMethod(raw.shippingMethod)) errors.shippingMethod = texts.shippingMethod;
  validateCard((raw.card ?? {}) as Record<string, unknown>, now, errors);
  if (!UUID.test(text(raw.idempotencyKey))) errors.idempotencyKey = texts.idempotencyKey;
  if (!validExpected(raw.expected)) errors.expected = texts.expected;

  return Object.keys(errors).length > 0 ? { ok: false, fields: errors } : { ok: true, body: raw as unknown as PlaceOrderBody };
}
