import { FREE_SHIPPING_THRESHOLD } from '@/lib/shipping';
import { CART_HREF, productHref } from '@/lib/routes';
import type { StrapiCart, StrapiCartLine } from '@/lib/strapi/cart';
import { strapiMediaUrl } from '@/lib/strapi/media';
import {
  boardSizeFromKey,
  formatBoardSize,
  formatStandardSize,
  type StandardSizeValue,
} from '@/lib/strapi/sizes';
import { formatPrice } from '@/shared/components/product-card/product-card';

export interface CartLineView {
  /** `<productDocumentId>:<sizeKey>` — unique per line. */
  key: string;
  productDocumentId: string;
  sizeKey: string;
  name: string;
  href: string;
  sizeLabel: string;
  unitPrice: string;
  lineTotal: string;
  quantity: number;
  /** The size's live stock; the stepper stops here. */
  maxQty: number;
  image: { src: string; alt: string; fit: 'contain' | 'cover' } | null;
  soldOut: boolean;
  unavailable: boolean;
  /** Quantity was lowered to stock on this read. */
  adjusted: boolean;
  /** Sold out or unavailable: excluded from the subtotal and blocks checkout. */
  blocked: boolean;
}

export interface CartView {
  lines: CartLineView[];
  /** Units across every line, for the header badge. */
  count: number;
  subtotal: string;
  /** Formatted amount still needed for free shipping; null once it's unlocked. */
  remainingForFreeShipping: string | null;
  /** 0–1. */
  freeShippingProgress: number;
  hasBlockingLines: boolean;
  /** Lines removed on this read because their product is gone. */
  removedCount: number;
  isEmpty: boolean;
}

const STANDARD_SIZES: StandardSizeValue[] = ['S', 'M', 'L', 'XL', 'OneSize'];

const toCents = (amount: number) => Math.round(amount * 100) / 100;

function sizeLabel({ size, sizeKey, sizeType }: StrapiCartLine) {
  if (size) return 'Size' in size ? formatStandardSize(size.Size) : formatBoardSize(size);

  // The size is gone from the product: label it from the key the line stored.
  if (sizeType === 'Surfboard') {
    const board = boardSizeFromKey(sizeKey);
    return board ? formatBoardSize(board) : sizeKey;
  }
  return STANDARD_SIZES.includes(sizeKey as StandardSizeValue) ? formatStandardSize(sizeKey as StandardSizeValue) : sizeKey;
}

function toLineView(line: StrapiCartLine): CartLineView {
  return {
    key: `${line.productDocumentId}:${line.sizeKey}`,
    productDocumentId: line.productDocumentId,
    sizeKey: line.sizeKey,
    name: line.name,
    href: productHref(line.slug),
    sizeLabel: sizeLabel(line),
    unitPrice: formatPrice(line.price),
    lineTotal: formatPrice(toCents(line.price * line.quantity)),
    quantity: line.quantity,
    maxQty: line.stock,
    image: line.image
      ? {
          src: strapiMediaUrl(line.image.url),
          alt: line.image.alternativeText ?? line.name,
          fit: line.sizeType === 'Surfboard' ? 'contain' : 'cover',
        }
      : null,
    soldOut: line.soldOut,
    unavailable: line.unavailable,
    adjusted: line.adjusted,
    blocked: line.soldOut || line.unavailable,
  };
}

export function toCartView({ lines, removedCount }: StrapiCart): CartView {
  const views = lines.map(toLineView);
  const subtotal = toCents(
    lines.reduce((sum, line) => (line.soldOut || line.unavailable ? sum : sum + line.price * line.quantity), 0)
  );
  const remaining = toCents(FREE_SHIPPING_THRESHOLD - subtotal);

  return {
    lines: views,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: formatPrice(subtotal),
    remainingForFreeShipping: remaining > 0 ? formatPrice(remaining) : null,
    freeShippingProgress: Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD),
    hasBlockingLines: views.some((line) => line.blocked),
    removedCount,
    isEmpty: views.length === 0,
  };
}

export const EMPTY_CART: CartView = toCartView({ lines: [], removedCount: 0 });

/** True on the cart page, whether the path arrives as `/cart` or locale-prefixed (`/en/cart`). */
export function isCartPath(pathname: string | null) {
  return (pathname ?? '').replace(/^\/en(?=\/|$)/, '') === CART_HREF;
}

/** Stretches a ButtonCTA (natural width by default) to fill the cart's narrow columns, as in the design. */
export const FULL_WIDTH_CTA = '[&>*]:w-full [&>*]:justify-center';

/** The design's outlined `.btn-cart-secondary` (Continue Shopping). */
export const SECONDARY_BUTTON =
  'block w-full rounded-[9px] border-2 border-ink px-5 py-[13px] text-center text-sm font-bold uppercase tracking-[0.03em] text-ink hover:bg-ink hover:text-white';
