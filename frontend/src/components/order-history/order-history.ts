import type { StrapiOrder } from '@/lib/strapi/orders';
import { strapiMediaUrl } from '@/lib/strapi/media';
import { formatPrice } from '@/shared/components/product-card/product-card';
import { texts } from './order-history-texts';

export type OrderStatusKey = keyof typeof texts.status;

export type OrderThumb = { kind: 'image'; src: string; alt: string } | { kind: 'initials'; text: string };

export interface OrderHistoryItem {
  orderNumber: string;
  placedLabel: string;
  itemCount: string;
  status: { key: OrderStatusKey; label: string };
  total: string;
  preview: OrderThumb | null;
  lines: { key: string; name: string; spec: string; lineTotal: string; thumb: OrderThumb }[];
  subtotal: string;
  shipping: string;
}

// UTC so the server render and the browser agree on the day.
const DATE = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

const STATUS_KEYS = Object.keys(texts.status) as OrderStatusKey[];

// A constructor, not a literal: the tsconfig target predates the `u` flag in literals.
const WORD = new RegExp("\\p{L}[\\p{L}'’-]*", 'gu');

/** Design gap: a thumbnail without an image shows up to two initials of the product name. */
export function initialsOf(name: string): string {
  const words = name.match(WORD) ?? [];
  return words
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');
}

function placedLabel(placedAt: string) {
  const date = new Date(placedAt);
  return Number.isNaN(date.getTime()) ? '' : texts.placed(DATE.format(date));
}

function statusOf(status: string): OrderHistoryItem['status'] {
  const key = STATUS_KEYS.find((candidate) => candidate === status);
  if (key) return { key, label: texts.status[key] };
  // An unknown status still renders, in the neutral Processing style.
  return { key: 'processing', label: status.charAt(0).toUpperCase() + status.slice(1) };
}

function thumbOf(line: StrapiOrder['lines'][number]): OrderThumb {
  return line.imageUrl
    ? { kind: 'image', src: strapiMediaUrl(line.imageUrl), alt: line.imageAlt ?? line.name }
    : { kind: 'initials', text: initialsOf(line.name) };
}

/** One card in My Account → Order History, from the order's snapshot (never live products). */
export function toOrderHistoryItem(order: StrapiOrder): OrderHistoryItem {
  const lines = order.lines.map((line) => ({
    key: `${line.productDocumentId}:${line.sizeKey}`,
    name: line.name,
    spec: `${line.sizeLabel} · ${texts.quantity(line.quantity)}`,
    lineTotal: formatPrice(line.lineTotal),
    thumb: thumbOf(line),
  }));

  return {
    orderNumber: order.orderNumber,
    placedLabel: placedLabel(order.placedAt),
    itemCount: texts.itemCount(order.lines.reduce((sum, line) => sum + line.quantity, 0)),
    status: statusOf(order.status),
    total: formatPrice(order.total),
    preview: lines[0]?.thumb ?? null,
    lines,
    subtotal: formatPrice(order.subtotal),
    shipping: order.shippingCost === 0 ? texts.free : formatPrice(order.shippingCost),
  };
}
