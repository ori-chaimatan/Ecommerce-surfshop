import { describe, expect, it } from 'vitest';
import type { CartResponse } from '../../src/api/cart/cart-logic';
import {
  OrderError,
  US_STATES,
  buildOrderSnapshot,
  compareWithExpected,
  lineKey,
  orderNumber,
  toCents,
  toOrderResponse,
  validatePlaceOrder,
} from '../../src/api/order/order-logic';

const NOW = new Date('2026-10-11T12:00:00Z');
const KEY = '0b6c3f5e-8f0a-4c1e-9a43-6f1f2d0c9a11';

const shipping = {
  firstName: 'Jamie',
  lastName: 'Rivera',
  address1: '1 Ocean Ave',
  address2: '',
  city: 'Santa Cruz',
  state: 'CA',
  postalCode: '95060',
  phone: '',
};

const cardInput = { number: '4242424242424242', expMonth: 12, expYear: 2030, cvc: '123', name: 'Jamie Rivera' };

const cartLine = (overrides: Partial<CartResponse['lines'][number]> = {}): CartResponse['lines'][number] => ({
  productDocumentId: 'board-1',
  slug: 'ci-pro',
  name: 'CI Pro',
  price: 829,
  sizeType: 'Surfboard',
  sizeKey: '6-0-29.4',
  size: { LengthFt: 6, LengthInches: 0, VolumeL: 29.4 },
  quantity: 1,
  stock: 3,
  image: { url: '/uploads/ci.png', width: 800, height: 1000, alternativeText: 'CI Pro board' },
  soldOut: false,
  unavailable: false,
  adjusted: false,
  ...overrides,
});

const shorts = cartLine({
  productDocumentId: 'shorts-1',
  slug: 'samurai',
  name: 'Samurai Pro 22" Boardshort',
  price: 39.99,
  sizeType: 'Standard',
  sizeKey: 'M',
  size: { Size: 'M' },
  quantity: 2,
  stock: 5,
  image: null,
});

const cart = (lines = [cartLine(), shorts], removedCount = 0): CartResponse => ({ lines, removedCount });

const expectedFor = (c: CartResponse, total: number) => ({
  total,
  lines: c.lines.map((line) => ({
    productDocumentId: line.productDocumentId,
    sizeKey: line.sizeKey,
    quantity: line.quantity,
    unitPrice: line.price,
  })),
});

// 829 + 2 × 39.99 = 908.98, free standard shipping.
const body = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: KEY,
  shipping,
  shippingMethod: 'standard',
  card: cardInput,
  expected: expectedFor(cart(), 908.98),
  ...overrides,
});

function fieldsOf(run: () => unknown): Record<string, string> {
  try {
    run();
  } catch (error) {
    expect(error).toBeInstanceOf(OrderError);
    expect((error as OrderError).code).toBe('bad-request');
    return (error as OrderError).fields ?? {};
  }
  throw new Error('expected an OrderError');
}

describe('orderNumber (AC2)', () => {
  it('is WL- plus 6 digits', () => {
    expect(orderNumber(104233)).toBe('WL-104233');
    expect(orderNumber(100000)).toMatch(/^WL-\d{6}$/);
  });

  it('defaults to a random 6-digit number', () => {
    expect(orderNumber()).toMatch(/^WL-[1-9]\d{5}$/);
  });
});

describe('toCents', () => {
  it('rounds to whole cents', () => {
    expect(toCents(19.99)).toBe(1999);
    expect(toCents('27.50')).toBe(2750);
    expect(toCents(0.1 + 0.2)).toBe(30);
    expect(toCents(829)).toBe(82900);
  });
});

describe('US_STATES', () => {
  it('has the 50 states plus DC', () => {
    expect(US_STATES).toHaveLength(51);
    expect(US_STATES.map((s) => s.code)).toEqual(expect.arrayContaining(['CA', 'NY', 'DC', 'HI', 'AK']));
  });
});

describe('validatePlaceOrder (AC3, AC7)', () => {
  it('returns the normalised input', () => {
    const input = validatePlaceOrder(body({ shipping: { ...shipping, phone: '(831) 555-0100', firstName: '  Jamie ' } }), NOW);
    expect(input.idempotencyKey).toBe(KEY);
    expect(input.shipping).toEqual({ ...shipping, firstName: 'Jamie', phone: '8315550100', address2: '' });
    expect(input.shippingMethod).toBe('standard');
    expect(input.expected.total).toBe(908.98);
  });

  it('accepts ZIP+4 and an 11-digit phone starting with 1', () => {
    const input = validatePlaceOrder(body({ shipping: { ...shipping, postalCode: '95060-1234', phone: '1 831 555 0100' } }), NOW);
    expect(input.shipping.postalCode).toBe('95060-1234');
    expect(input.shipping.phone).toBe('8315550100');
  });

  it('requires a uuid idempotency key', () => {
    expect(fieldsOf(() => validatePlaceOrder(body({ idempotencyKey: 'nope' }), NOW))).toHaveProperty('idempotencyKey');
  });

  it.each([
    ['firstName', ''],
    ['lastName', ' '],
    ['address1', ''],
    ['city', ''],
    ['state', 'XX'],
    ['state', 'ca'],
    ['postalCode', '9506'],
    ['postalCode', '95060-12'],
    ['phone', '555-0100'],
    ['firstName', 'x'.repeat(51)],
    ['address2', 'x'.repeat(101)],
  ])('rejects %s = %j', (field, value) => {
    expect(fieldsOf(() => validatePlaceOrder(body({ shipping: { ...shipping, [field]: value } }), NOW))).toHaveProperty(field);
  });

  it('rejects an unknown shipping method', () => {
    expect(fieldsOf(() => validatePlaceOrder(body({ shippingMethod: 'overnight' }), NOW))).toHaveProperty('shippingMethod');
  });

  it('reports card errors under the card field names', () => {
    const fields = fieldsOf(() => validatePlaceOrder(body({ card: { ...cardInput, number: '4242424242424241', cvc: '1' } }), NOW));
    expect(fields).toHaveProperty('cardNumber');
    expect(fields).toHaveProperty('cardCvc');
  });

  it('collects every bad field at once', () => {
    const fields = fieldsOf(() => validatePlaceOrder({ expected: expectedFor(cart(), 1) }, NOW));
    expect(Object.keys(fields)).toEqual(
      expect.arrayContaining(['idempotencyKey', 'firstName', 'lastName', 'address1', 'city', 'state', 'postalCode', 'shippingMethod', 'cardNumber'])
    );
  });

  it('rejects a missing or malformed expected block', () => {
    expect(() => validatePlaceOrder(body({ expected: undefined }), NOW)).toThrow(OrderError);
    expect(() => validatePlaceOrder(body({ expected: { total: 'x', lines: [] } }), NOW)).toThrow(OrderError);
    expect(() =>
      validatePlaceOrder(body({ expected: { total: 1, lines: [{ productDocumentId: 'a', sizeKey: 'M', quantity: 0, unitPrice: 1 }] } }), NOW)
    ).toThrow(OrderError);
  });

  it('rejects a body that is not an object', () => {
    expect(() => validatePlaceOrder(null, NOW)).toThrow(OrderError);
  });
});

describe('compareWithExpected (AC4, AC10)', () => {
  it('returns the totals in cents when the cart matches what was shown', () => {
    expect(compareWithExpected(cart(), expectedFor(cart(), 908.98), 'standard')).toEqual({
      subtotalCents: 90898,
      shippingCents: 0,
      totalCents: 90898,
    });
  });

  it('adds shipping under the threshold and for express', () => {
    const small = cart([shorts]);
    expect(compareWithExpected(small, expectedFor(small, 79.98), 'standard')).toEqual({
      subtotalCents: 7998,
      shippingCents: 0,
      totalCents: 7998,
    });
    const one = cart([{ ...shorts, quantity: 1 }]);
    expect(compareWithExpected(one, expectedFor(one, 51.99), 'standard').totalCents).toBe(5199);
    expect(compareWithExpected(one, expectedFor(one, 64.99), 'express').totalCents).toBe(6499);
  });

  it('throws cart-empty for an empty cart', () => {
    expect(() => compareWithExpected(cart([]), expectedFor(cart([]), 0), 'standard')).toThrow(
      expect.objectContaining({ code: 'cart-empty' })
    );
  });

  const changed = (c: CartResponse, expected: ReturnType<typeof expectedFor>, keys: string[]) => {
    try {
      compareWithExpected(c, expected, 'standard');
    } catch (error) {
      expect((error as OrderError).code).toBe('cart-changed');
      expect((error as OrderError).lineKeys).toEqual(keys);
      return;
    }
    throw new Error('expected cart-changed');
  };

  it('flags a line added since review', () => {
    changed(cart(), expectedFor(cart([cartLine()]), 829), [lineKey('shorts-1', 'M')]);
  });

  it('flags a line removed since review', () => {
    changed(cart([cartLine()]), expectedFor(cart(), 908.98), [lineKey('shorts-1', 'M')]);
  });

  it('flags a changed quantity', () => {
    changed(cart([cartLine(), { ...shorts, quantity: 3 }]), expectedFor(cart(), 908.98), [lineKey('shorts-1', 'M')]);
  });

  it('flags a changed unit price', () => {
    changed(cart([cartLine({ price: 799 }), shorts]), expectedFor(cart(), 908.98), [lineKey('board-1', '6-0-29.4')]);
  });

  it('flags a different total', () => {
    changed(cart(), expectedFor(cart(), 920.98), []);
  });

  it.each(['soldOut', 'unavailable', 'adjusted'] as const)('flags a %s line', (flag) => {
    const c = cart([cartLine({ [flag]: true }), shorts]);
    changed(c, expectedFor(c, 908.98), [lineKey('board-1', '6-0-29.4')]);
  });

  it('flags lines pruned by re-validation', () => {
    changed(cart(undefined, 1), expectedFor(cart(), 908.98), []);
  });
});

describe('buildOrderSnapshot (AC1)', () => {
  const input = validatePlaceOrder(body({ shipping: { ...shipping, address2: 'Apt 2', phone: '8315550100' } }), NOW);
  const snapshot = buildOrderSnapshot({
    orderNumber: 'WL-104233',
    user: { documentId: 'user-doc-7', email: 'jamie@example.com' },
    cart: cart(),
    input,
    totals: { subtotalCents: 90898, shippingCents: 0, totalCents: 90898 },
    payment: { brand: 'visa', last4: '4242', reference: 'mock_abc' },
    now: NOW,
  });

  it('records the order header', () => {
    expect(snapshot).toMatchObject({
      OrderNumber: 'WL-104233',
      Status: 'processing',
      User: 'user-doc-7',
      Email: 'jamie@example.com',
      ShippingMethod: 'standard',
      Subtotal: 908.98,
      ShippingCost: 0,
      Total: 908.98,
      Currency: 'USD',
      PaymentBrand: 'visa',
      PaymentLast4: '4242',
      PaymentReference: 'mock_abc',
      IdempotencyKey: KEY,
      PlacedAt: '2026-10-11T12:00:00.000Z',
    });
  });

  it('records the address with the country', () => {
    expect(snapshot.ShippingAddress).toEqual({
      FirstName: 'Jamie',
      LastName: 'Rivera',
      Address1: '1 Ocean Ave',
      Address2: 'Apt 2',
      City: 'Santa Cruz',
      State: 'CA',
      PostalCode: '95060',
      Country: 'US',
      Phone: '8315550100',
    });
  });

  it('snapshots each line: name, size, price, quantity, total and image', () => {
    expect(snapshot.Lines).toEqual([
      {
        Product: 'board-1',
        ProductDocumentId: 'board-1',
        Name: 'CI Pro',
        Slug: 'ci-pro',
        SizeKey: '6-0-29.4',
        SizeLabel: `6'0" · 29.4L`,
        UnitPrice: 829,
        Quantity: 1,
        LineTotal: 829,
        ImageUrl: '/uploads/ci.png',
        ImageAlt: 'CI Pro board',
      },
      {
        Product: 'shorts-1',
        ProductDocumentId: 'shorts-1',
        Name: 'Samurai Pro 22" Boardshort',
        Slug: 'samurai',
        SizeKey: 'M',
        SizeLabel: 'M',
        UnitPrice: 39.99,
        Quantity: 2,
        LineTotal: 79.98,
        ImageUrl: null,
        ImageAlt: null,
      },
    ]);
  });

  it('never contains card data', () => {
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain('4242424242424242');
    expect(json).not.toContain('"123"');
    expect(json).not.toContain('Cvc');
  });
});

describe('toOrderResponse (AC8, AC15)', () => {
  const stored = {
    id: 12,
    documentId: 'order-doc',
    OrderNumber: 'WL-104233',
    Status: 'processing',
    Email: 'jamie@example.com',
    ShippingMethod: 'express',
    ShippingAddress: { id: 3, FirstName: 'Jamie', LastName: 'Rivera', Address1: '1 Ocean Ave', Address2: null, City: 'Santa Cruz', State: 'CA', PostalCode: '95060', Country: 'US', Phone: null },
    Lines: [
      { id: 9, ProductDocumentId: 'shorts-1', Name: 'Samurai', Slug: 'samurai', SizeKey: 'M', SizeLabel: 'M', UnitPrice: '39.99', Quantity: 2, LineTotal: '79.98', ImageUrl: null, ImageAlt: null },
    ],
    Subtotal: '79.98',
    ShippingCost: '25',
    Total: '104.98',
    Currency: 'USD',
    PaymentBrand: 'visa',
    PaymentLast4: '4242',
    PaymentReference: 'mock_abc',
    IdempotencyKey: KEY,
    PlacedAt: '2026-10-11T12:00:00.000Z',
  };

  it('returns the owner view with numbers and no ids, key or reference', () => {
    const response = toOrderResponse(stored);
    expect(response).toEqual({
      orderNumber: 'WL-104233',
      status: 'processing',
      email: 'jamie@example.com',
      placedAt: '2026-10-11T12:00:00.000Z',
      shippingMethod: 'express',
      shippingAddress: {
        firstName: 'Jamie',
        lastName: 'Rivera',
        address1: '1 Ocean Ave',
        address2: null,
        city: 'Santa Cruz',
        state: 'CA',
        postalCode: '95060',
        country: 'US',
        phone: null,
      },
      lines: [
        { productDocumentId: 'shorts-1', name: 'Samurai', slug: 'samurai', sizeKey: 'M', sizeLabel: 'M', unitPrice: 39.99, quantity: 2, lineTotal: 79.98, imageUrl: null, imageAlt: null },
      ],
      subtotal: 79.98,
      shippingCost: 25,
      total: 104.98,
      currency: 'USD',
      payment: { brand: 'visa', last4: '4242' },
    });
    const json = JSON.stringify(response);
    expect(json).not.toContain('order-doc');
    expect(json).not.toContain(KEY);
    expect(json).not.toContain('mock_abc');
  });
});
