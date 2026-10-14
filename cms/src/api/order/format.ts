/**
 * Display labels stored on order lines and used in the email. Same output as the storefront's
 * formatBoardSize / formatStandardSize / formatPrice (frontend/src/lib/strapi/sizes.ts,
 * shared/components/product-card/product-card.ts); both sides run the same test cases.
 */

export type RawSize =
  | { Size: 'S' | 'M' | 'L' | 'XL' | 'OneSize' }
  | { LengthFt: number; LengthInches: number; VolumeL: number };

export function sizeLabel(size: RawSize): string {
  if ('Size' in size) return size.Size === 'OneSize' ? 'One Size' : size.Size;
  return `${Number(size.LengthFt)}'${Number(size.LengthInches)}" · ${Number(size.VolumeL)}L`;
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
  }).format(price);
}
