import { describe, expect, it } from 'vitest';
import { cardBrand, charge, luhn, validateCard } from '../../src/api/order/mock-payment';

const NOW = new Date('2026-10-11T12:00:00Z');
const card = (overrides: Record<string, unknown> = {}) => ({
  number: '4242424242424242',
  expMonth: 12,
  expYear: 2030,
  cvc: '123',
  name: 'Jamie Rivera',
  ...overrides,
});

describe('luhn (AC7)', () => {
  it.each(['4242424242424242', '4000000000000002', '4000000000000119', '5555555555554444', '378282246310005', '2223003122003222'])(
    'accepts %s',
    (number) => expect(luhn(number)).toBe(true)
  );

  it.each(['4242424242424241', '1234567812345678', '', '42', 'abcd'])('rejects %s', (number) => {
    expect(luhn(number)).toBe(false);
  });
});

describe('cardBrand (AC7)', () => {
  it.each([
    ['4242424242424242', 'visa'],
    ['5105105105105100', 'mastercard'],
    ['5555555555554444', 'mastercard'],
    ['2221000000000009', 'mastercard'],
    ['2720990000000007', 'mastercard'],
    ['340000000000009', 'amex'],
    ['378282246310005', 'amex'],
  ])('%s is %s', (number, brand) => expect(cardBrand(number)).toBe(brand));

  it.each(['2220990000000000', '2721000000000000', '5000000000000000', '6011111111111117', '3530111333300000'])(
    '%s is unsupported',
    (number) => expect(cardBrand(number)).toBeNull()
  );
});

describe('validateCard (AC7)', () => {
  it('accepts a valid card', () => {
    expect(validateCard(card(), NOW)).toEqual({});
  });

  it('ignores spaces in the number', () => {
    expect(validateCard(card({ number: '4242 4242 4242 4242' }), NOW)).toEqual({});
  });

  it('rejects a number that fails Luhn', () => {
    expect(validateCard(card({ number: '4242424242424241' }), NOW)).toHaveProperty('cardNumber');
  });

  it('rejects an unsupported brand with its own message', () => {
    const errors = validateCard(card({ number: '6011111111111117' }), NOW);
    expect(errors.cardNumber).toMatch(/Visa, Mastercard/);
  });

  it('needs 3 CVC digits, or 4 for Amex', () => {
    expect(validateCard(card({ cvc: '12' }), NOW)).toHaveProperty('cardCvc');
    expect(validateCard(card({ cvc: '1234' }), NOW)).toHaveProperty('cardCvc');
    expect(validateCard(card({ number: '378282246310005', cvc: '123' }), NOW)).toHaveProperty('cardCvc');
    expect(validateCard(card({ number: '378282246310005', cvc: '1234' }), NOW)).toEqual({});
  });

  it('accepts the current month and rejects last month', () => {
    expect(validateCard(card({ expMonth: 10, expYear: 2026 }), NOW)).toEqual({});
    expect(validateCard(card({ expMonth: 9, expYear: 2026 }), NOW)).toHaveProperty('cardExpiry');
    expect(validateCard(card({ expMonth: 12, expYear: 2025 }), NOW)).toHaveProperty('cardExpiry');
  });

  it('rejects an impossible month or a far-future year', () => {
    expect(validateCard(card({ expMonth: 13 }), NOW)).toHaveProperty('cardExpiry');
    expect(validateCard(card({ expMonth: 0 }), NOW)).toHaveProperty('cardExpiry');
    expect(validateCard(card({ expYear: 2060 }), NOW)).toHaveProperty('cardExpiry');
  });

  it('requires the name on the card', () => {
    expect(validateCard(card({ name: '   ' }), NOW)).toHaveProperty('cardName');
  });

  it('reports every bad field of a malformed card', () => {
    expect(Object.keys(validateCard({}, NOW)).sort()).toEqual(['cardCvc', 'cardExpiry', 'cardName', 'cardNumber']);
  });
});

describe('charge (AC7)', () => {
  const ref = () => 'mock_fixed';

  it('approves any other valid card with brand, last 4 and a mock reference only', () => {
    const result = charge(card(), ref);
    expect(result).toEqual({ outcome: 'approved', brand: 'visa', last4: '4242', reference: 'mock_fixed' });
    expect(JSON.stringify(result)).not.toContain('4242424242424242');
    expect(JSON.stringify(result)).not.toContain('123');
  });

  it('declines 4000 0000 0000 0002', () => {
    expect(charge(card({ number: '4000 0000 0000 0002' }), ref)).toEqual({ outcome: 'declined' });
  });

  it('errors on 4000 0000 0000 0119', () => {
    expect(charge(card({ number: '4000000000000119' }), ref)).toEqual({ outcome: 'error' });
  });

  it('uses a mock_<uuid> reference by default', () => {
    const result = charge(card());
    expect(result.outcome === 'approved' && result.reference).toMatch(/^mock_[0-9a-f-]{36}$/);
  });
});
