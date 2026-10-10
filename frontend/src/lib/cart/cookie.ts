import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import type { CartIdentity } from '@/lib/strapi/cart';

/** Holds a guest's cart token. httpOnly: only the /api/cart route handlers read it. */
export const CART_COOKIE_NAME = 'westline_cart';

const THIRTY_DAYS = 60 * 60 * 24 * 30;

export function getCartCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: THIRTY_DAYS,
  };
}

export function readCartIdentity(request: NextRequest): Required<CartIdentity> {
  return {
    jwt: request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null,
    token: request.cookies.get(CART_COOKIE_NAME)?.value ?? null,
  };
}
