import { describe, expect, it } from 'vitest';
import {
  CartError,
  addLine,
  findSize,
  mergeLines,
  parseLineBody,
  removeLine,
  revalidate,
  setLineQty,
  sizeKeyOf,
  toCartResponse,
  type CartProduct,
  type LineRef,
  type PopulatedLine,
} from '../../src/api/cart/cart-logic';

const board: CartProduct = {
  documentId: 'board-1',
  Name: 'CI Pro',
  Slug: 'ci-pro',
  Price: 829,
  SizeType: 'Surfboard',
  Images: [{ url: '/uploads/ci.png', width: 800, height: 1000, alternativeText: null }],
  BoardSizes: [
    { LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 3 },
    { LengthFt: 5, LengthInches: 10, VolumeL: '27.50', Stock: 0 },
  ],
  StandardSizes: [],
};

const shorts: CartProduct = {
  documentId: 'shorts-1',
  Name: 'Samurai Pro 22" Boardshort',
  Slug: 'samurai-pro-22-boardshort',
  Price: '79.50',
  SizeType: 'Standard',
  Images: [],
  BoardSizes: [],
  StandardSizes: [
    { Size: 'M', Stock: 2 },
    { Size: 'OneSize', Stock: 5 },
    { Size: 'XL', Stock: 0 },
  ],
};

const ref = (productDocumentId: string, sizeKey: string, quantity: number): LineRef => ({
  productDocumentId,
  sizeKey,
  quantity,
});

function errorCode(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    return error instanceof CartError ? error.code : 'not-a-cart-error';
  }
  return 'no-error';
}

describe('sizeKeyOf / findSize (AC3)', () => {
  it('derives board keys as LengthFt-LengthInches-VolumeL', () => {
    expect(sizeKeyOf({ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 1 })).toBe('6-0-29.4');
  });

  it('normalises decimal volumes so "27.50" and 27.5 give the same key', () => {
    expect(sizeKeyOf({ LengthFt: 5, LengthInches: 10, VolumeL: '27.50', Stock: 1 })).toBe('5-10-27.5');
  });

  it('uses the enum value for standard sizes', () => {
    expect(sizeKeyOf({ Size: 'OneSize', Stock: 1 })).toBe('OneSize');
  });

  it('finds the size on the product by key, or null', () => {
    expect(findSize(board, '6-0-29.4')).toMatchObject({ Stock: 3 });
    expect(findSize(shorts, 'M')).toMatchObject({ Stock: 2 });
    expect(findSize(board, '6-1-29.4')).toBeNull();
    expect(findSize(shorts, 'S')).toBeNull();
  });
});

describe('parseLineBody (AC2)', () => {
  it('accepts a product + size key', () => {
    expect(parseLineBody({ productDocumentId: 'p', sizeKey: 'M' }, false)).toEqual({ productDocumentId: 'p', sizeKey: 'M' });
  });

  it('accepts a quantity between 1 and 99 when required', () => {
    expect(parseLineBody({ productDocumentId: 'p', sizeKey: 'M', quantity: 99 }, true)).toEqual({
      productDocumentId: 'p',
      sizeKey: 'M',
      quantity: 99,
    });
  });

  it.each([
    [null, false],
    [{}, false],
    [{ productDocumentId: '', sizeKey: 'M' }, false],
    [{ productDocumentId: 'p', sizeKey: 3 }, false],
    [{ productDocumentId: 'p', sizeKey: 'x'.repeat(33) }, false],
    [{ productDocumentId: 'p', sizeKey: 'M' }, true],
    [{ productDocumentId: 'p', sizeKey: 'M', quantity: 0 }, true],
    [{ productDocumentId: 'p', sizeKey: 'M', quantity: 100 }, true],
    [{ productDocumentId: 'p', sizeKey: 'M', quantity: 1.5 }, true],
    [{ productDocumentId: 'p', sizeKey: 'M', quantity: '2' }, true],
  ])('rejects %j as bad-request', (body, withQuantity) => {
    expect(errorCode(() => parseLineBody(body, withQuantity))).toBe('bad-request');
  });
});

describe('addLine (AC3)', () => {
  it('adds a new line with quantity 1', () => {
    expect(addLine([], board, '6-0-29.4')).toEqual([ref('board-1', '6-0-29.4', 1)]);
  });

  it('increments the existing line for the same product + size', () => {
    const lines = [ref('shorts-1', 'M', 1), ref('board-1', '6-0-29.4', 1)];
    expect(addLine(lines, board, '6-0-29.4')).toEqual([ref('shorts-1', 'M', 1), ref('board-1', '6-0-29.4', 2)]);
  });

  it('keeps different sizes of one product as separate lines', () => {
    expect(addLine([ref('shorts-1', 'M', 1)], shorts, 'OneSize')).toEqual([
      ref('shorts-1', 'M', 1),
      ref('shorts-1', 'OneSize', 1),
    ]);
  });

  it('clamps to the size stock', () => {
    expect(addLine([ref('shorts-1', 'M', 2)], shorts, 'M')).toEqual([ref('shorts-1', 'M', 2)]);
  });

  it('rejects a sold-out size with sold-out and an unknown size with not-found', () => {
    expect(errorCode(() => addLine([], board, '5-10-27.5'))).toBe('sold-out');
    expect(errorCode(() => addLine([], shorts, 'S'))).toBe('not-found');
  });
});

describe('setLineQty / removeLine (AC3)', () => {
  it('sets the quantity, clamped to stock', () => {
    expect(setLineQty([ref('board-1', '6-0-29.4', 1)], board, '6-0-29.4', 2)).toEqual([ref('board-1', '6-0-29.4', 2)]);
    expect(setLineQty([ref('board-1', '6-0-29.4', 1)], board, '6-0-29.4', 9)).toEqual([ref('board-1', '6-0-29.4', 3)]);
  });

  it('rejects a line that is not in the cart, an unknown size, and a sold-out size', () => {
    expect(errorCode(() => setLineQty([], board, '6-0-29.4', 2))).toBe('not-found');
    expect(errorCode(() => setLineQty([ref('shorts-1', 'S', 1)], shorts, 'S', 2))).toBe('not-found');
    expect(errorCode(() => setLineQty([ref('shorts-1', 'XL', 1)], shorts, 'XL', 2))).toBe('sold-out');
  });

  it('removes only the matching line; removing the last line leaves none', () => {
    const lines = [ref('shorts-1', 'M', 1), ref('shorts-1', 'OneSize', 2)];
    expect(removeLine(lines, 'shorts-1', 'M')).toEqual([ref('shorts-1', 'OneSize', 2)]);
    expect(removeLine([ref('shorts-1', 'M', 1)], 'shorts-1', 'M')).toEqual([]);
  });
});

describe('mergeLines (AC5)', () => {
  it('sums quantities per product + size and clamps to stock', () => {
    const user: PopulatedLine[] = [{ product: shorts, sizeKey: 'M', quantity: 1 }];
    const guest: PopulatedLine[] = [
      { product: shorts, sizeKey: 'M', quantity: 2 },
      { product: board, sizeKey: '6-0-29.4', quantity: 1 },
    ];
    expect(mergeLines(user, guest)).toEqual([ref('shorts-1', 'M', 2), ref('board-1', '6-0-29.4', 1)]);
  });

  it('drops lines whose product is gone', () => {
    expect(mergeLines([], [{ product: null, sizeKey: 'M', quantity: 1 }])).toEqual([]);
  });

  it('keeps sold-out and unavailable lines with their summed quantity (re-validation flags them)', () => {
    const guest: PopulatedLine[] = [
      { product: shorts, sizeKey: 'XL', quantity: 1 },
      { product: board, sizeKey: '7-0-40', quantity: 2 },
    ];
    expect(mergeLines([], guest)).toEqual([ref('shorts-1', 'XL', 1), ref('board-1', '7-0-40', 2)]);
  });
});

describe('revalidate (AC4)', () => {
  it('leaves valid lines untouched', () => {
    const result = revalidate([{ product: board, sizeKey: '6-0-29.4', quantity: 2 }]);
    expect(result.changed).toBe(false);
    expect(result.removedCount).toBe(0);
    expect(result.lines[0]).toMatchObject({ quantity: 2, stock: 3, soldOut: false, unavailable: false, adjusted: false });
  });

  it('clamps quantity above stock and flags the line adjusted', () => {
    const result = revalidate([{ product: shorts, sizeKey: 'M', quantity: 5 }]);
    expect(result.changed).toBe(true);
    expect(result.lines[0]).toMatchObject({ quantity: 2, stock: 2, adjusted: true, soldOut: false });
    expect(result.refs).toEqual([ref('shorts-1', 'M', 2)]);
  });

  it('flags Stock 0 as soldOut and keeps the quantity', () => {
    const result = revalidate([{ product: shorts, sizeKey: 'XL', quantity: 2 }]);
    expect(result.changed).toBe(false);
    expect(result.lines[0]).toMatchObject({ quantity: 2, soldOut: true, unavailable: false, adjusted: false });
  });

  it('flags a size key that no longer exists as unavailable, distinct from soldOut', () => {
    const result = revalidate([{ product: board, sizeKey: '6-0-30', quantity: 1 }]);
    expect(result.lines[0]).toMatchObject({ unavailable: true, soldOut: false, size: null, stock: 0 });
    expect(result.refs).toEqual([ref('board-1', '6-0-30', 1)]);
  });

  it('prunes lines whose product is missing (deleted or unpublished) and counts them', () => {
    const result = revalidate([
      { product: null, sizeKey: 'M', quantity: 1 },
      { product: shorts, sizeKey: 'M', quantity: 1 },
    ]);
    expect(result.changed).toBe(true);
    expect(result.removedCount).toBe(1);
    expect(result.lines).toHaveLength(1);
    expect(result.refs).toEqual([ref('shorts-1', 'M', 1)]);
  });
});

describe('toCartResponse (AC4)', () => {
  it('returns live product data with a numeric price and raw size fields', () => {
    const { lines } = revalidate([
      { product: board, sizeKey: '6-0-29.4', quantity: 1 },
      { product: shorts, sizeKey: 'M', quantity: 2 },
    ]);
    const response = toCartResponse(lines, 0);

    expect(response).toEqual({
      removedCount: 0,
      lines: [
        {
          productDocumentId: 'board-1',
          slug: 'ci-pro',
          name: 'CI Pro',
          price: 829,
          sizeType: 'Surfboard',
          sizeKey: '6-0-29.4',
          size: { LengthFt: 6, LengthInches: 0, VolumeL: 29.4 },
          quantity: 1,
          stock: 3,
          image: { url: '/uploads/ci.png', width: 800, height: 1000, alternativeText: null },
          soldOut: false,
          unavailable: false,
          adjusted: false,
        },
        {
          productDocumentId: 'shorts-1',
          slug: 'samurai-pro-22-boardshort',
          name: 'Samurai Pro 22" Boardshort',
          price: 79.5,
          sizeType: 'Standard',
          sizeKey: 'M',
          size: { Size: 'M' },
          quantity: 2,
          stock: 2,
          image: null,
          soldOut: false,
          unavailable: false,
          adjusted: false,
        },
      ],
    });
  });

  it('includes the guest token only when one was just issued', () => {
    expect(toCartResponse([], 0, 'tok')).toEqual({ lines: [], removedCount: 0, token: 'tok' });
    expect(toCartResponse([], 2)).toEqual({ lines: [], removedCount: 2 });
  });
});
