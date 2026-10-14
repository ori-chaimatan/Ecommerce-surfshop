import { strapiRequest } from './client';
import type { ProductSizeType, StandardSizeValue, StrapiBoardSize } from './sizes';

/** One cart line as the Strapi cart API returns it: live product data, never a stored price. */
export interface StrapiCartLine {
  productDocumentId: string;
  slug: string;
  name: string;
  price: number;
  sizeType: ProductSizeType;
  sizeKey: string;
  /** Null when the size key no longer exists on the product. */
  size: Pick<StrapiBoardSize, 'LengthFt' | 'LengthInches' | 'VolumeL'> | { Size: StandardSizeValue } | null;
  quantity: number;
  stock: number;
  image: { url: string; width: number | null; height: number | null; alternativeText: string | null } | null;
  soldOut: boolean;
  unavailable: boolean;
  adjusted: boolean;
}

export interface StrapiCart {
  lines: StrapiCartLine[];
  /** Lines pruned on this read because their product was deleted or unpublished. */
  removedCount: number;
  /** Set only when this request created a guest cart. */
  token?: string;
}

/** Who the cart belongs to: the session JWT and/or the guest cart token. */
export interface CartIdentity {
  jwt?: string | null;
  token?: string | null;
}

export interface CartLineInput {
  productDocumentId: string;
  sizeKey: string;
}

export type CartResult = { ok: true; cart: StrapiCart } | { ok: false; status: number; code: string | null };

const LABEL = 'cart';
const EXPECTED_ERRORS = [400, 401, 404, 409];

function identityHeaders({ jwt, token }: CartIdentity): Record<string, string> {
  return {
    ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}),
    ...(token ? { 'x-cart-token': token } : {}),
  };
}

function isCartLine(value: unknown): value is StrapiCartLine {
  const line = value as StrapiCartLine | null;
  return (
    typeof line === 'object' &&
    line !== null &&
    typeof line.productDocumentId === 'string' &&
    typeof line.slug === 'string' &&
    typeof line.name === 'string' &&
    typeof line.price === 'number' &&
    typeof line.sizeKey === 'string' &&
    typeof line.quantity === 'number' &&
    typeof line.stock === 'number'
  );
}

function isCart(value: unknown): value is StrapiCart {
  const cart = value as StrapiCart | null;
  return (
    typeof cart === 'object' &&
    cart !== null &&
    Array.isArray(cart.lines) &&
    cart.lines.every(isCartLine) &&
    typeof cart.removedCount === 'number'
  );
}

async function cartRequest(
  path: string,
  identity: CartIdentity,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<CartResult> {
  const { ok, status, data } = await strapiRequest(path, {
    label: LABEL,
    method,
    body,
    headers: identityHeaders(identity),
    silentStatuses: EXPECTED_ERRORS,
  });

  if (status === 0) return { ok: false, status: 503, code: null };
  if (!ok) {
    const code = (data as { error?: { code?: unknown } } | null)?.error?.code;
    return { ok: false, status, code: typeof code === 'string' ? code : null };
  }
  if (!isCart(data)) {
    console.error(`[${LABEL}] unexpected cart response`);
    return { ok: false, status: 502, code: null };
  }
  return { ok: true, cart: data };
}

export function getCart(identity: CartIdentity) {
  return cartRequest('carts/current', identity, 'GET');
}

export function addCartLine(identity: CartIdentity, line: CartLineInput) {
  return cartRequest('carts/current/lines', identity, 'POST', line);
}

export function setCartLineQty(identity: CartIdentity, line: CartLineInput & { quantity: number }) {
  return cartRequest('carts/current/lines', identity, 'PATCH', line);
}

export function removeCartLine(identity: CartIdentity, { productDocumentId, sizeKey }: CartLineInput) {
  const path = `carts/current/lines/${encodeURIComponent(productDocumentId)}/${encodeURIComponent(sizeKey)}`;
  return cartRequest(path, identity, 'DELETE');
}

/** Moves the guest cart into the signed-in user's cart (summed, clamped to stock). */
export function mergeGuestCart(jwt: string, token: string) {
  return cartRequest('carts/merge', { jwt, token }, 'POST');
}
