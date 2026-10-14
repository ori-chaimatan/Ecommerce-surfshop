import type { PlaceOrderBody } from '@/lib/checkout/validate';
import { strapiRequest } from './client';

/** An order as the Strapi order API returns it to its owner: a snapshot taken when it was placed. */
export interface StrapiOrder {
  orderNumber: string;
  status: string;
  email: string;
  placedAt: string;
  shippingMethod: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string | null;
  };
  lines: {
    productDocumentId: string;
    name: string;
    slug: string;
    sizeKey: string;
    sizeLabel: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl: string | null;
    imageAlt: string | null;
  }[];
  subtotal: number;
  shippingCost: number;
  total: number;
  currency: string;
  payment: { brand: string; last4: string };
}

export interface OrderError {
  ok: false;
  status: number;
  code: string | null;
  message?: string;
  fields?: Record<string, string>;
  lineKeys?: string[];
}

export type PlaceOrderResult = { ok: true; status: number; order: StrapiOrder } | OrderError;

const LABEL = 'orders';
const EXPECTED_ERRORS = [400, 401, 402, 404, 409, 502];

function isOrder(value: unknown): value is StrapiOrder {
  const order = value as StrapiOrder | null;
  return (
    typeof order === 'object' &&
    order !== null &&
    typeof order.orderNumber === 'string' &&
    typeof order.email === 'string' &&
    typeof order.total === 'number' &&
    Array.isArray(order.lines) &&
    typeof order.shippingAddress === 'object' &&
    order.shippingAddress !== null
  );
}

const bearer = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

/** Places the signed-in shopper's cart as an order. Card data passes through and is never logged. */
export async function placeOrder(jwt: string, body: PlaceOrderBody): Promise<PlaceOrderResult> {
  const { ok, status, data } = await strapiRequest('orders', {
    label: LABEL,
    method: 'POST',
    body,
    headers: bearer(jwt),
    silentStatuses: EXPECTED_ERRORS,
  });

  if (status === 0) return { ok: false, status: 503, code: null };
  if (!ok) {
    const error: Partial<Omit<OrderError, 'ok' | 'status'>> = (data as { error?: Omit<OrderError, 'ok' | 'status'> } | null)?.error ?? {};
    return {
      ok: false,
      status,
      code: typeof error.code === 'string' ? error.code : null,
      ...(typeof error.message === 'string' ? { message: error.message } : {}),
      ...(error.fields ? { fields: error.fields } : {}),
      ...(Array.isArray(error.lineKeys) ? { lineKeys: error.lineKeys } : {}),
    };
  }

  const order = (data as { order?: unknown } | null)?.order;
  if (!isOrder(order)) {
    console.error(`[${LABEL}] unexpected order response`);
    return { ok: false, status: 502, code: null };
  }
  return { ok: true, status, order };
}

/** One order, for its owner only: anything else is a 404. */
export async function getOrder(jwt: string, orderNumber: string): Promise<{ ok: true; order: StrapiOrder } | { ok: false; status: number }> {
  const { ok, status, data } = await strapiRequest(`orders/${encodeURIComponent(orderNumber)}`, {
    label: LABEL,
    headers: bearer(jwt),
    silentStatuses: [401, 404],
  });

  if (status === 0) return { ok: false, status: 503 };
  if (!ok) return { ok: false, status };

  const order = (data as { order?: unknown } | null)?.order;
  if (!isOrder(order)) {
    console.error(`[${LABEL}] unexpected order response`);
    return { ok: false, status: 502 };
  }
  return { ok: true, order };
}

/** The signed-in shopper's own orders, newest first (order-history). Null when the session is rejected or Strapi fails. */
export async function getOrders(jwt: string): Promise<StrapiOrder[] | null> {
  const { ok, data } = await strapiRequest('orders', { label: LABEL, headers: bearer(jwt), silentStatuses: [401] });
  const orders = (data as { orders?: unknown } | null)?.orders;
  if (!ok || !Array.isArray(orders)) return null;
  return orders.filter(isOrder);
}
