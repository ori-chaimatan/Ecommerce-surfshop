import { randomUUID } from 'node:crypto';

/**
 * Simulated card payment — no gateway. Card data only passes through: callers keep the
 * brand, last 4 and reference, and nothing here logs or stores the number or CVC.
 *
 * Test numbers (Stripe-style): DECLINED_CARD is declined, ERROR_CARD fails with a processing
 * error, and any other valid card is approved.
 */

export type CardBrand = 'visa' | 'mastercard' | 'amex';

export interface CardInput {
  number: string;
  expMonth: number;
  expYear: number;
  cvc: string;
  name: string;
}

export type CardField = 'cardNumber' | 'cardExpiry' | 'cardCvc' | 'cardName';

export type ChargeResult =
  | { outcome: 'approved'; brand: CardBrand; last4: string; reference: string }
  | { outcome: 'declined' }
  | { outcome: 'error' };

export const DECLINED_CARD = '4000000000000002';
export const ERROR_CARD = '4000000000000119';
const MAX_YEARS_AHEAD = 20;
const MAX_NAME_LENGTH = 100;

export const digitsOf = (value: string) => value.replace(/[\s-]/g, '');

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
  if (prefix >= 2221 && prefix <= 2720) return 'mastercard';
  return null;
}

const isInt = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value);

function expiryValid(month: unknown, year: unknown, now: Date): boolean {
  if (!isInt(month) || !isInt(year) || month < 1 || month > 12) return false;
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const expiry = year * 12 + (month - 1);
  return expiry >= current && year <= now.getUTCFullYear() + MAX_YEARS_AHEAD;
}

/** Field errors for a card (empty when valid). */
export function validateCard(input: unknown, now: Date): Partial<Record<CardField, string>> {
  const { number, expMonth, expYear, cvc, name } = (input ?? {}) as Record<string, unknown>;
  const errors: Partial<Record<CardField, string>> = {};

  const brand = typeof number === 'string' ? cardBrand(number) : null;
  if (typeof number !== 'string' || !luhn(number)) errors.cardNumber = 'Enter a valid card number.';
  else if (!brand) errors.cardNumber = 'We accept Visa, Mastercard and American Express.';

  if (!expiryValid(expMonth, expYear, now)) errors.cardExpiry = 'Enter a valid expiration date.';

  const cvcLength = brand === 'amex' ? 4 : 3;
  if (typeof cvc !== 'string' || !new RegExp(`^\\d{${cvcLength}}$`).test(cvc)) {
    errors.cardCvc = `Enter the ${cvcLength}-digit security code.`;
  }

  if (typeof name !== 'string' || !name.trim() || name.trim().length > MAX_NAME_LENGTH) {
    errors.cardName = 'Enter the name on the card.';
  }

  return errors;
}

/** Charges a card that already passed validateCard. */
export function charge(card: CardInput, newReference: () => string = () => `mock_${randomUUID()}`): ChargeResult {
  const digits = digitsOf(card.number);
  if (digits === DECLINED_CARD) return { outcome: 'declined' };
  if (digits === ERROR_CARD) return { outcome: 'error' };
  return { outcome: 'approved', brand: cardBrand(digits)!, last4: digits.slice(-4), reference: newReference() };
}
