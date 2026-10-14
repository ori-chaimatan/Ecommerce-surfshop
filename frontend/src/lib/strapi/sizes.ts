/**
 * Product size model (Strapi `SizeType` + `BoardSizes` / `StandardSizes`). Strapi
 * stores no display label, so the storefront builds it here.
 */

export type ProductSizeType = 'Surfboard' | 'Standard';

export type StandardSizeValue = 'S' | 'M' | 'L' | 'XL' | 'OneSize';

export interface StrapiBoardSize {
  LengthFt: number;
  LengthInches: number;
  VolumeL: number;
  Stock: number;
}

export interface StrapiStandardSize {
  Size: StandardSizeValue;
  Stock: number;
}

const ONE_SIZE_LABEL = 'One Size';

/** Total length in inches, for ordering sizes: `{ LengthFt: 5, LengthInches: 11 }` → 71. */
export function boardLengthInches({ LengthFt, LengthInches }: Pick<StrapiBoardSize, 'LengthFt' | 'LengthInches'>) {
  return Number(LengthFt) * 12 + Number(LengthInches);
}

/** `{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4 }` → `6'0" · 29.4L`. */
export function formatBoardSize({ LengthFt, LengthInches, VolumeL }: Pick<StrapiBoardSize, 'LengthFt' | 'LengthInches' | 'VolumeL'>) {
  return `${Number(LengthFt)}'${Number(LengthInches)}" · ${Number(VolumeL)}L`;
}

export function formatStandardSize(size: StandardSizeValue) {
  return size === 'OneSize' ? ONE_SIZE_LABEL : size;
}

/**
 * Cart line keys. Size components have no stable id, so a cart line points at its size by
 * a key built from the size's own fields — the same rule as `cms/src/api/cart/cart-logic.ts`.
 */
export function boardSizeKey({ LengthFt, LengthInches, VolumeL }: Pick<StrapiBoardSize, 'LengthFt' | 'LengthInches' | 'VolumeL'>) {
  return `${Number(LengthFt)}-${Number(LengthInches)}-${Number(VolumeL)}`;
}

export function standardSizeKey({ Size }: Pick<StrapiStandardSize, 'Size'>) {
  return Size;
}

/** `6-0-29.4` → its board fields, for labelling a line whose size no longer exists. */
export function boardSizeFromKey(key: string): Pick<StrapiBoardSize, 'LengthFt' | 'LengthInches' | 'VolumeL'> | null {
  const match = /^(\d+)-(\d+)-(\d+(?:\.\d+)?)$/.exec(key);
  return match ? { LengthFt: Number(match[1]), LengthInches: Number(match[2]), VolumeL: Number(match[3]) } : null;
}
