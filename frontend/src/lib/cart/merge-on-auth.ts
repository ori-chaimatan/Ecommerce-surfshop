import type { NextRequest, NextResponse } from 'next/server';
import { mergeGuestCart } from '@/lib/strapi/cart';
import { CART_COOKIE_NAME } from './cookie';

/**
 * Called by every auth route that sets a session: moves the guest cart into the user's
 * cart and clears the guest cookie. Never fails the auth response — a failed merge is
 * logged and the guest cookie kept, so the next sign-in retries it.
 */
export async function withGuestCartMerge(request: NextRequest, response: NextResponse, jwt: string) {
  const token = request.cookies.get(CART_COOKIE_NAME)?.value;
  if (!token) return response;

  try {
    const result = await mergeGuestCart(jwt, token);
    if (!result.ok) {
      console.error('[cart] guest cart merge failed', result.status);
      return response;
    }
    response.cookies.set(CART_COOKIE_NAME, '', { path: '/', maxAge: 0 });
  } catch (error) {
    console.error('[cart] guest cart merge failed', error);
  }
  return response;
}
