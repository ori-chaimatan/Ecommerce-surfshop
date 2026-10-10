import { NextResponse } from 'next/server';
import { toCartView } from '@/components/cart/cart';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { CartIdentity, CartLineInput, CartResult } from '@/lib/strapi/cart';
import { CART_COOKIE_NAME, getCartCookieOptions, readCartIdentity } from './cookie';

const MAX_KEY_LENGTH = 32;
const MAX_ID_LENGTH = 64;
export const MAX_LINE_QUANTITY = 99;

const NO_STORE = { 'Cache-Control': 'no-store' };

/** Response header telling the client the session cookie was dropped, so it can refresh the header. */
export const SESSION_STATE_HEADER = 'x-westline-session';

const isId = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

/** Reads `{ productDocumentId, sizeKey[, quantity] }` from a request body; null when invalid. */
export async function readLineInput(request: Request, withQuantity: false): Promise<CartLineInput | null>;
export async function readLineInput(
  request: Request,
  withQuantity: true
): Promise<(CartLineInput & { quantity: number }) | null>;
export async function readLineInput(request: Request, withQuantity: boolean) {
  const body = await request.json().catch(() => null);
  const { productDocumentId, sizeKey, quantity } = (body ?? {}) as Record<string, unknown>;

  if (!isId(productDocumentId, MAX_ID_LENGTH) || !isId(sizeKey, MAX_KEY_LENGTH)) return null;
  if (!withQuantity) return { productDocumentId, sizeKey };
  if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QUANTITY) {
    return null;
  }
  return { productDocumentId, sizeKey, quantity };
}

export function badRequest() {
  return NextResponse.json({ error: { code: 'bad-request' } }, { status: 400, headers: NO_STORE });
}

/**
 * Turns a Strapi cart result into the route response: the cart view on success (setting the
 * guest cookie when Strapi just issued a token), or the error code with its status. Server
 * errors and an unreachable Strapi are both 503.
 */
export function cartResponse(result: CartResult) {
  if (!result.ok) {
    const status = result.status >= 500 ? 503 : result.status;
    return NextResponse.json({ error: { code: result.code } }, { status, headers: NO_STORE });
  }

  const response = NextResponse.json(toCartView(result.cart), { headers: NO_STORE });
  if (result.cart.token) {
    response.cookies.set(CART_COOKIE_NAME, result.cart.token, getCartCookieOptions());
  }
  return response;
}

/**
 * Runs a cart call as the current shopper. When Strapi rejects the session JWT (expired —
 * access tokens live 10 minutes in refresh mode — or invalid), the call is repeated as a
 * guest, the dead `westline_session` cookie is cleared and the response is flagged, so an
 * expired session never breaks the cart. Retrying is safe: a 401 means nothing was written.
 */
export async function respondAsShopper(request: NextRequest, call: (identity: CartIdentity) => Promise<CartResult>) {
  const identity = readCartIdentity(request);
  let result = await call(identity);
  const sessionRejected = !result.ok && result.status === 401 && identity.jwt !== null;
  if (sessionRejected) result = await call({ ...identity, jwt: null });

  const response = cartResponse(result);
  if (sessionRejected) {
    response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    response.headers.set(SESSION_STATE_HEADER, 'expired');
  }
  return response;
}
