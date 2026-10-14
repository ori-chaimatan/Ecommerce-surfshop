import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHECKOUT_KEY_STORAGE,
  CHECKOUT_STORAGE,
  clearCheckout,
  getIdempotencyKey,
  loadShippingDraft,
  rotateIdempotencyKey,
  saveShippingDraft,
} from '@/lib/checkout/storage';

const draft = {
  firstName: 'Jamie',
  lastName: 'Rivera',
  address1: '1 Ocean Ave',
  address2: '',
  city: 'Santa Cruz',
  state: 'CA',
  postalCode: '95060',
  phone: '',
  shippingMethod: 'express' as const,
};

describe('checkout storage (checkout AC6, AC13)', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('saves and restores the shipping fields and method', () => {
    saveShippingDraft(draft);
    expect(JSON.parse(sessionStorage.getItem(CHECKOUT_STORAGE)!)).toEqual(draft);
    expect(loadShippingDraft()).toEqual(draft);
  });

  it('never writes card fields, even if handed them', () => {
    saveShippingDraft({ ...draft, cardNumber: '4242424242424242', cardCvc: '123' } as never);
    const stored = sessionStorage.getItem(CHECKOUT_STORAGE)!;
    expect(stored).not.toContain('4242');
    expect(stored).not.toContain('cardCvc');
  });

  it('ignores unknown or malformed stored data', () => {
    sessionStorage.setItem(CHECKOUT_STORAGE, '{not json');
    expect(loadShippingDraft()).toBeNull();
    sessionStorage.setItem(CHECKOUT_STORAGE, JSON.stringify({ firstName: 3, shippingMethod: 'overnight', evil: 'x' }));
    expect(loadShippingDraft()).toEqual({});
  });

  it('keeps one idempotency key until it is rotated', () => {
    const key = getIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(getIdempotencyKey()).toBe(key);
    expect(sessionStorage.getItem(CHECKOUT_KEY_STORAGE)).toBe(key);

    rotateIdempotencyKey();
    expect(getIdempotencyKey()).not.toBe(key);
  });

  it('clears the draft and the key after an order', () => {
    saveShippingDraft(draft);
    const key = getIdempotencyKey();
    clearCheckout();
    expect(sessionStorage.getItem(CHECKOUT_STORAGE)).toBeNull();
    expect(getIdempotencyKey()).not.toBe(key);
  });

  it('survives a storage that throws (private mode, blocked site data)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('denied');
    });

    expect(() => saveShippingDraft(draft)).not.toThrow();
    expect(loadShippingDraft()).toBeNull();
    expect(() => clearCheckout()).not.toThrow();
    const key = getIdempotencyKey();
    expect(key).toMatch(/^[0-9a-f-]{36}$/);
    expect(getIdempotencyKey()).toBe(key); // kept in memory for this page
  });
});
