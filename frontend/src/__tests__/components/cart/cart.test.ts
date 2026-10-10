// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { EMPTY_CART, isCartPath, toCartView } from '@/components/cart/cart';
import type { StrapiCart, StrapiCartLine } from '@/lib/strapi/cart';

const board: StrapiCartLine = {
  productDocumentId: 'b1',
  slug: 'ci-pro',
  name: 'CI Pro',
  price: 600,
  sizeType: 'Surfboard',
  sizeKey: '6-0-29.9',
  size: { LengthFt: 6, LengthInches: 0, VolumeL: 29.9 },
  quantity: 1,
  stock: 4,
  image: { url: '/uploads/ci.png', width: 800, height: 1000, alternativeText: null },
  soldOut: false,
  unavailable: false,
  adjusted: false,
};

const shorts: StrapiCartLine = {
  productDocumentId: 's1',
  slug: 'samurai',
  name: 'Samurai',
  price: 24.5,
  sizeType: 'Standard',
  sizeKey: 'OneSize',
  size: { Size: 'OneSize' },
  quantity: 2,
  stock: 3,
  image: { url: 'https://cdn.example.com/s.png', width: 10, height: 10, alternativeText: 'Front' },
  soldOut: false,
  unavailable: false,
  adjusted: false,
};

const cart = (lines: StrapiCartLine[], removedCount = 0): StrapiCart => ({ lines, removedCount });

describe('toCartView lines (AC7)', () => {
  it('maps each line to labels, live prices and links', () => {
    const view = toCartView(cart([board, shorts]));

    expect(view.lines[0]).toEqual({
      key: 'b1:6-0-29.9',
      productDocumentId: 'b1',
      sizeKey: '6-0-29.9',
      name: 'CI Pro',
      href: '/products/ci-pro',
      sizeLabel: `6'0" · 29.9L`,
      unitPrice: '$600',
      lineTotal: '$600',
      quantity: 1,
      maxQty: 4,
      image: { src: 'http://localhost:1337/uploads/ci.png', alt: 'CI Pro', fit: 'contain' },
      soldOut: false,
      unavailable: false,
      adjusted: false,
      blocked: false,
    });
    expect(view.lines[1]).toMatchObject({
      sizeLabel: 'One Size',
      unitPrice: '$24.50',
      lineTotal: '$49',
      image: { src: 'https://cdn.example.com/s.png', alt: 'Front', fit: 'cover' },
    });
  });

  it('labels an unavailable line from its stored key', () => {
    const view = toCartView(
      cart([
        { ...board, size: null, sizeKey: '5-8-24.3', unavailable: true, stock: 0 },
        { ...shorts, size: null, sizeKey: 'XL', unavailable: true, stock: 0 },
      ])
    );
    expect(view.lines.map((line) => line.sizeLabel)).toEqual([`5'8" · 24.3L`, 'XL']);
    expect(view.lines.every((line) => line.blocked)).toBe(true);
  });

  it('has no image when the product has none', () => {
    expect(toCartView(cart([{ ...board, image: null }])).lines[0].image).toBeNull();
  });
});

describe('toCartView totals and flags (AC7, AC13)', () => {
  it('counts every unit and sums only lines that are neither sold out nor unavailable', () => {
    const view = toCartView(
      cart([
        board,
        shorts,
        { ...shorts, productDocumentId: 's2', soldOut: true, stock: 0 },
        { ...shorts, productDocumentId: 's3', unavailable: true, size: null, stock: 0 },
      ])
    );
    expect(view.count).toBe(7);
    expect(view.subtotal).toBe('$649');
    expect(view.hasBlockingLines).toBe(true);
  });

  it.each([
    [0, '$75', 0],
    [74, '$1', 74 / 75],
    [75, null, 1],
    [200, null, 1],
  ])('subtotal %d → remaining %s, progress %d', (price, remaining, progress) => {
    const view = toCartView(cart(price ? [{ ...board, price }] : []));
    expect(view.remainingForFreeShipping).toBe(remaining);
    expect(view.freeShippingProgress).toBeCloseTo(progress);
  });

  it('rounds to cents', () => {
    const view = toCartView(cart([{ ...shorts, price: 10.1, quantity: 3 }]));
    expect(view.subtotal).toBe('$30.30');
    expect(view.remainingForFreeShipping).toBe('$44.70');
  });

  it('carries removedCount and isEmpty', () => {
    expect(toCartView(cart([], 2))).toMatchObject({ removedCount: 2, isEmpty: true, hasBlockingLines: false });
    expect(toCartView(cart([board])).isEmpty).toBe(false);
  });

  it('EMPTY_CART is the view of an empty cart', () => {
    expect(EMPTY_CART).toEqual(toCartView(cart([])));
  });
});

describe('isCartPath (AC10)', () => {
  it('matches /cart with or without the locale prefix, and nothing else', () => {
    expect(isCartPath('/cart')).toBe(true);
    expect(isCartPath('/en/cart')).toBe(true);
    expect(isCartPath('/products/cart')).toBe(false);
    expect(isCartPath('/cart/x')).toBe(false);
    expect(isCartPath(null)).toBe(false);
  });
});
