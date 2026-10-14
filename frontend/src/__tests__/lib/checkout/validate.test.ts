// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CHECKOUT_FIELDS,
  US_STATES,
  cardBrand,
  formatCardNumber,
  formatExpiry,
  luhn,
  parseExpiry,
  validatePlaceOrderBody,
} from '@/lib/checkout/validate';

const NOW = new Date('2026-10-11T12:00:00Z');
const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';

const body = (overrides: Record<string, unknown> = {}) => ({
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
  card: { number: '4242 4242 4242 4242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' },
  expected: { total: 79, lines: [{ productDocumentId: 'p1', sizeKey: 'M', quantity: 1, unitPrice: 79 }] },
  ...overrides,
});

const fieldsOf = (value: unknown) => {
  const result = validatePlaceOrderBody(value, NOW);
  return result.ok ? {} : result.fields;
};

describe('US_STATES (checkout AC9)', () => {
  it('lists the 50 states and DC, sorted by name', () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES[0]).toEqual({ code: 'AL', name: 'Alabama' });
    expect(US_STATES.map((s) => s.code)).toContain('DC');
  });
});

describe('card helpers (checkout AC7)', () => {
  it('checks Luhn like the server', () => {
    expect(luhn('4242424242424242')).toBe(true);
    expect(luhn('4242 4242 4242 4241')).toBe(false);
  });

  it('detects Visa, Mastercard and Amex', () => {
    expect(cardBrand('4242')).toBe('visa');
    expect(cardBrand('5555')).toBe('mastercard');
    expect(cardBrand('2221')).toBe('mastercard');
    expect(cardBrand('3782')).toBe('amex');
    expect(cardBrand('6011')).toBeNull();
  });

  it('groups the number as typed: 4-4-4-4, or 4-6-5 for Amex', () => {
    expect(formatCardNumber('4242424242424242')).toBe('4242 4242 4242 4242');
    expect(formatCardNumber('4242-4242')).toBe('4242 4242');
    expect(formatCardNumber('378282246310005')).toBe('3782 822463 10005');
    expect(formatCardNumber('42424242424242429999')).toBe('4242 4242 4242 4242 999');
  });

  it('formats the expiry as MM/YY', () => {
    expect(formatExpiry('1')).toBe('1');
    expect(formatExpiry('12')).toBe('12');
    expect(formatExpiry('123')).toBe('12/3');
    expect(formatExpiry('12/30')).toBe('12/30');
    expect(formatExpiry('1230')).toBe('12/30');
  });

  it('parses MM/YY into a month and a four-digit year', () => {
    expect(parseExpiry('12/30')).toEqual({ expMonth: 12, expYear: 2030 });
    expect(parseExpiry('01 / 27')).toEqual({ expMonth: 1, expYear: 2027 });
    expect(parseExpiry('1/30')).toBeNull();
    expect(parseExpiry('')).toBeNull();
  });
});

describe('validatePlaceOrderBody (checkout AC11, AC21)', () => {
  it('accepts a valid body', () => {
    expect(validatePlaceOrderBody(body(), NOW)).toEqual({ ok: true, body: body() });
  });

  it.each([
    ['firstName', '', 'Enter your first name.'],
    ['lastName', ' ', 'Enter your last name.'],
    ['address1', '', 'Enter your address.'],
    ['city', '', 'Enter your city.'],
    ['state', '', 'Select a state.'],
    ['state', 'XX', 'Select a state.'],
    ['postalCode', '9506', 'Enter a 5-digit ZIP code.'],
    ['phone', '555-0100', 'Enter a 10-digit phone number.'],
  ])('%s = %j → %s', (field, value, message) => {
    const b = body();
    expect(fieldsOf({ ...b, shipping: { ...b.shipping, [field]: value } })).toEqual({ [field]: message });
  });

  it('accepts ZIP+4 and a phone with punctuation or a leading 1', () => {
    const b = body();
    expect(fieldsOf({ ...b, shipping: { ...b.shipping, postalCode: '95060-1234', phone: '+1 (831) 555-0100' } })).toEqual({});
  });

  it('rejects an unknown shipping method', () => {
    expect(fieldsOf(body({ shippingMethod: 'overnight' }))).toEqual({ shippingMethod: 'Choose a shipping method.' });
  });

  it('checks the card like the server', () => {
    const card = body().card;
    expect(fieldsOf(body({ card: { ...card, number: '4242424242424241' } }))).toEqual({ cardNumber: 'Enter a valid card number.' });
    expect(fieldsOf(body({ card: { ...card, number: '6011111111111117' } }))).toEqual({
      cardNumber: 'We accept Visa, Mastercard and American Express.',
    });
    expect(fieldsOf(body({ card: { ...card, expMonth: 9, expYear: 2026 } }))).toEqual({ cardExpiry: 'Enter a valid expiration date.' });
    expect(fieldsOf(body({ card: { ...card, expMonth: 10, expYear: 2026 } }))).toEqual({});
    expect(fieldsOf(body({ card: { ...card, cvc: '12' } }))).toEqual({ cardCvc: 'Enter the 3-digit security code.' });
    expect(fieldsOf(body({ card: { ...card, number: '378282246310005', cvc: '123' } }))).toEqual({
      cardCvc: 'Enter the 4-digit security code.',
    });
    expect(fieldsOf(body({ card: { ...card, name: '' } }))).toEqual({ cardName: 'Enter the name on the card.' });
  });

  it('reports a missing checkout key and review', () => {
    expect(Object.keys(fieldsOf(body({ idempotencyKey: 'x', expected: null })))).toEqual(['idempotencyKey', 'expected']);
  });

  it('collects every field error of an empty form, in form order', () => {
    expect(Object.keys(fieldsOf({ ...body(), shipping: {}, card: {} }))).toEqual([
      'firstName',
      'lastName',
      'address1',
      'city',
      'state',
      'postalCode',
      'cardNumber',
      'cardExpiry',
      'cardCvc',
      'cardName',
    ]);
  });

  it('rejects a body that is not an object', () => {
    expect(validatePlaceOrderBody('nope', NOW)).toEqual({ ok: false, fields: {} });
  });

  it('lists the form fields in visual order, for focusing the first error', () => {
    expect(CHECKOUT_FIELDS).toEqual([
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
    ]);
  });
});
