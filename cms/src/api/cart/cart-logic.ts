/**
 * Pure cart rules: line identity (product + derived SizeKey), stock clamping,
 * merging and re-validation against live product data. No Strapi calls here —
 * cart-store.ts does the reads and writes.
 *
 * Size components have no stable id (clear-stale-sizes rebuilds them on save), so
 * a line points at its size by a key derived from the size's own fields.
 */

export type StandardSizeValue = 'S' | 'M' | 'L' | 'XL' | 'OneSize';

export interface BoardSize {
  LengthFt: number;
  LengthInches: number;
  VolumeL: number | string;
  Stock: number;
}

export interface StandardSize {
  Size: StandardSizeValue;
  Stock: number;
}

export interface CartImage {
  url: string;
  width: number | null;
  height: number | null;
  alternativeText: string | null;
}

export interface CartProduct {
  documentId: string;
  Name: string;
  Slug: string;
  Price: number | string;
  SizeType: 'Surfboard' | 'Standard';
  Images?: CartImage[] | null;
  BoardSizes?: BoardSize[] | null;
  StandardSizes?: StandardSize[] | null;
}

/** A stored line, as written to the Cart's `Lines` component. */
export interface LineRef {
  productDocumentId: string;
  sizeKey: string;
  quantity: number;
}

/** A stored line with its product populated (null once the product is deleted or unpublished). */
export interface PopulatedLine {
  product: CartProduct | null;
  sizeKey: string;
  quantity: number;
}

export interface ValidatedLine {
  product: CartProduct;
  sizeKey: string;
  size: BoardSize | StandardSize | null;
  quantity: number;
  stock: number;
  soldOut: boolean;
  unavailable: boolean;
  adjusted: boolean;
}

export type CartErrorCode = 'bad-request' | 'unauthorized' | 'not-found' | 'sold-out';

export class CartError extends Error {
  constructor(readonly code: CartErrorCode, message: string = code) {
    super(message);
  }
}

export const MAX_LINE_QUANTITY = 99;
const MAX_KEY_LENGTH = 32;

export function sizeKeyOf(size: BoardSize | StandardSize): string {
  return 'Size' in size
    ? size.Size
    : `${Number(size.LengthFt)}-${Number(size.LengthInches)}-${Number(size.VolumeL)}`;
}

export function findSize(product: CartProduct, sizeKey: string): BoardSize | StandardSize | null {
  const sizes: (BoardSize | StandardSize)[] =
    product.SizeType === 'Surfboard' ? product.BoardSizes ?? [] : product.StandardSizes ?? [];
  return sizes.find((size) => sizeKeyOf(size) === sizeKey) ?? null;
}

function isId(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength;
}

/** Validates a lines request body. `withQuantity` requires an integer quantity in 1–99. */
export function parseLineBody(body: unknown, withQuantity: false): Omit<LineRef, 'quantity'>;
export function parseLineBody(body: unknown, withQuantity: true): LineRef;
export function parseLineBody(body: unknown, withQuantity: boolean) {
  const { productDocumentId, sizeKey, quantity } = (body ?? {}) as Record<string, unknown>;

  if (!isId(productDocumentId, 64) || !isId(sizeKey, MAX_KEY_LENGTH)) {
    throw new CartError('bad-request', 'productDocumentId and sizeKey are required.');
  }
  if (!withQuantity) return { productDocumentId, sizeKey };

  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
    throw new CartError('bad-request', `quantity must be an integer from 1 to ${MAX_LINE_QUANTITY}.`);
  }
  return { productDocumentId, sizeKey, quantity };
}

const sameLine = (line: LineRef, productDocumentId: string, sizeKey: string) =>
  line.productDocumentId === productDocumentId && line.sizeKey === sizeKey;

/** Stock of a size that exists and isn't sold out; throws otherwise. */
function availableStock(product: CartProduct, sizeKey: string): number {
  const size = findSize(product, sizeKey);
  if (!size) throw new CartError('not-found', 'This size does not exist.');
  if (!(size.Stock > 0)) throw new CartError('sold-out', 'This size is sold out.');
  return size.Stock;
}

/** Adds one of the product's size: increments the matching line, clamped to stock. */
export function addLine(lines: LineRef[], product: CartProduct, sizeKey: string): LineRef[] {
  const stock = availableStock(product, sizeKey);
  const existing = lines.find((line) => sameLine(line, product.documentId, sizeKey));

  if (!existing) return [...lines, { productDocumentId: product.documentId, sizeKey, quantity: 1 }];
  return lines.map((line) =>
    line === existing ? { ...line, quantity: Math.min(line.quantity + 1, stock, MAX_LINE_QUANTITY) } : line
  );
}

export function setLineQty(lines: LineRef[], product: CartProduct, sizeKey: string, quantity: number): LineRef[] {
  const existing = lines.find((line) => sameLine(line, product.documentId, sizeKey));
  if (!existing) throw new CartError('not-found', 'This item is not in the cart.');

  const stock = availableStock(product, sizeKey);
  return lines.map((line) => (line === existing ? { ...line, quantity: Math.min(quantity, stock) } : line));
}

export function removeLine(lines: LineRef[], productDocumentId: string, sizeKey: string): LineRef[] {
  return lines.filter((line) => !sameLine(line, productDocumentId, sizeKey));
}

/**
 * Merges a guest cart's lines into a user's: quantities summed per product + size and
 * clamped to stock. Lines without a product are dropped; sold-out and unavailable lines
 * are kept so re-validation can flag them.
 */
export function mergeLines(target: PopulatedLine[], source: PopulatedLine[]): LineRef[] {
  const merged: LineRef[] = [];

  for (const { product, sizeKey, quantity } of [...target, ...source]) {
    if (!product) continue;
    const existing = merged.find((line) => sameLine(line, product.documentId, sizeKey));
    if (existing) existing.quantity += quantity;
    else merged.push({ productDocumentId: product.documentId, sizeKey, quantity });
  }

  const products = new Map([...target, ...source].flatMap(({ product }) => (product ? [[product.documentId, product]] : [])));
  return merged.map((line) => {
    const stock = findSize(products.get(line.productDocumentId)!, line.sizeKey)?.Stock ?? 0;
    return stock > 0 ? { ...line, quantity: Math.min(line.quantity, stock, MAX_LINE_QUANTITY) } : line;
  });
}

/**
 * Re-checks stored lines against live product data: prunes lines whose product is gone,
 * clamps quantities above stock, and flags sold-out (Stock 0) and unavailable (size key
 * no longer on the product) lines. `changed` means `refs` should be written back.
 */
export function revalidate(stored: PopulatedLine[]) {
  const lines: ValidatedLine[] = [];
  let removedCount = 0;
  let changed = false;

  for (const { product, sizeKey, quantity } of stored) {
    if (!product) {
      removedCount += 1;
      changed = true;
      continue;
    }

    const size = findSize(product, sizeKey);
    const stock = size ? Math.max(0, size.Stock) : 0;
    const adjusted = stock > 0 && quantity > stock;
    if (adjusted) changed = true;

    lines.push({
      product,
      sizeKey,
      size,
      quantity: adjusted ? stock : quantity,
      stock,
      soldOut: size !== null && stock === 0,
      unavailable: size === null,
      adjusted,
    });
  }

  const refs: LineRef[] = lines.map((line) => ({
    productDocumentId: line.product.documentId,
    sizeKey: line.sizeKey,
    quantity: line.quantity,
  }));

  return { lines, refs, removedCount, changed };
}

function rawSize(size: BoardSize | StandardSize | null) {
  if (!size) return null;
  return 'Size' in size
    ? { Size: size.Size }
    : { LengthFt: Number(size.LengthFt), LengthInches: Number(size.LengthInches), VolumeL: Number(size.VolumeL) };
}

/** The API response. Prices come from the live product — lines never store one. */
export function toCartResponse(lines: ValidatedLine[], removedCount: number, token?: string) {
  return {
    lines: lines.map(({ product, sizeKey, size, quantity, stock, soldOut, unavailable, adjusted }) => {
      const image = product.Images?.[0];
      return {
        productDocumentId: product.documentId,
        slug: product.Slug,
        name: product.Name,
        price: Number(product.Price),
        sizeType: product.SizeType,
        sizeKey,
        size: rawSize(size),
        quantity,
        stock,
        image: image
          ? { url: image.url, width: image.width, height: image.height, alternativeText: image.alternativeText }
          : null,
        soldOut,
        unavailable,
        adjusted,
      };
    }),
    removedCount,
    ...(token ? { token } : {}),
  };
}

export type CartResponse = ReturnType<typeof toCartResponse>;
