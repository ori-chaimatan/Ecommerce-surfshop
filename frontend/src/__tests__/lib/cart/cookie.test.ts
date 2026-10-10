// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CART_COOKIE_NAME, getCartCookieOptions, readCartIdentity } from '@/lib/cart/cookie';

describe('cart cookie (AC6)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is the httpOnly, lax, site-wide westline_cart cookie kept for 30 days', () => {
    expect(CART_COOKIE_NAME).toBe('westline_cart');
    expect(getCartCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it('is secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getCartCookieOptions().secure).toBe(true);
  });

  it('reads the session JWT and the guest token from the request cookies', () => {
    const request = new NextRequest('http://localhost/api/cart', {
      headers: { cookie: 'westline_session=j.w.t; westline_cart=tok' },
    });
    expect(readCartIdentity(request)).toEqual({ jwt: 'j.w.t', token: 'tok' });
    expect(readCartIdentity(new NextRequest('http://localhost/api/cart'))).toEqual({ jwt: null, token: null });
  });
});
