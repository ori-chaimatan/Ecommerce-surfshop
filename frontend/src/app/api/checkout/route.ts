import { NextResponse, type NextRequest } from 'next/server';
import { toCartView } from '@/components/cart/cart';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { NO_STORE, SESSION_STATE_HEADER, tooManyRequests } from '@/lib/cart/route-helpers';
import { validatePlaceOrderBody } from '@/lib/checkout/validate';
import { checkoutLimiter, clientIp } from '@/lib/rate-limit';
import { orderConfirmationHref } from '@/lib/routes';
import { getCart } from '@/lib/strapi/cart';
import { placeOrder } from '@/lib/strapi/orders';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: NO_STORE });

/**
 * Places the signed-in shopper's order. Validates the body like the form did, forwards it to
 * Strapi (which re-validates, charges the mock card and records the order), and maps the
 * result for the checkout page. The body carries card data, so nothing here logs it.
 */
export async function POST(request: NextRequest) {
  const jwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return json({ error: { code: 'unauthorized' } }, 401);

  const limit = checkoutLimiter.hit(`${clientIp(request)}:${jwt.slice(-24)}`);
  if (!limit.ok) return tooManyRequests(limit.retryAfter);

  const body = await request.json().catch(() => null);
  const validated = validatePlaceOrderBody(body, new Date());
  if (!validated.ok) return json({ error: { code: 'bad-request', fields: validated.fields } }, 400);

  const result = await placeOrder(jwt, validated.body);
  if (result.ok) {
    const { orderNumber } = result.order;
    return json({ orderNumber, href: orderConfirmationHref(orderNumber) }, result.status);
  }

  const { status, code, message, fields, lineKeys } = result;
  const error = { code, ...(message ? { message } : {}), ...(fields ? { fields } : {}), ...(lineKeys ? { lineKeys } : {}) };

  if (status === 401) {
    const response = json({ error: { code: 'unauthorized' } }, 401);
    response.cookies.set(SESSION_COOKIE_NAME, '', { path: '/', maxAge: 0 });
    response.headers.set(SESSION_STATE_HEADER, 'expired');
    return response;
  }

  if (code === 'cart-changed') {
    const cart = await getCart({ jwt });
    return json({ error, ...(cart.ok ? { cart: toCartView(cart.cart) } : {}) }, 409);
  }

  // A declined card (402) and a payment processing error (502) are answers; any other
  // server failure means Strapi is unavailable.
  const passThrough = status < 500 || code === 'payment-error';
  return passThrough ? json({ error }, status) : json({ error: { code: 'unavailable' } }, 503);
}
