// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/oauth/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/oauth/complete', () => {
  it('sets an httpOnly session cookie from a posted jwt (AC21)', async () => {
    const { POST } = await import('@/app/api/auth/oauth/complete/route');
    const res = await POST(makeRequest({ jwt: 'a.jwt.token' }));

    expect(res.status).toBe(200);
    const setCookie = res.cookies.get('westline_session');
    expect(setCookie?.value).toBe('a.jwt.token');
    expect(setCookie?.httpOnly).toBe(true);
  });

  it('rejects a missing jwt without setting a cookie', async () => {
    const { POST } = await import('@/app/api/auth/oauth/complete/route');
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(res.cookies.get('westline_session')).toBeUndefined();
  });

  it('rejects an empty-string jwt without setting a cookie', async () => {
    const { POST } = await import('@/app/api/auth/oauth/complete/route');
    const res = await POST(makeRequest({ jwt: '' }));

    expect(res.status).toBe(400);
    expect(res.cookies.get('westline_session')).toBeUndefined();
  });
});

describe('POST /api/auth/oauth/complete — guest cart merge (add-to-cart AC5)', () => {
  const cartFetch = vi.fn();
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  beforeEach(() => {
    vi.stubGlobal('fetch', cartFetch);
    cartFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('merges the guest cart into the new session and clears the guest cookie', async () => {
    cartFetch
      .mockResolvedValueOnce(json({ lines: [], removedCount: 0 }));

    const { POST } = await import('@/app/api/auth/oauth/complete/route');
    const res = await POST(
      new NextRequest('http://localhost/api/auth/oauth/complete', {
        method: 'POST',
        body: JSON.stringify({ jwt: 'a.jwt.token' }),
        headers: { cookie: 'westline_cart=guest-token' },
      })
    );

    expect(res.status).toBe(200);
    expect(cartFetch).toHaveBeenLastCalledWith(
      'http://localhost:1337/api/carts/merge',
      expect.objectContaining({ headers: { Authorization: 'Bearer a.jwt.token', 'x-cart-token': 'guest-token' } })
    );
    expect(res.cookies.get('westline_session')?.value).toBe('a.jwt.token');
    expect(res.cookies.get('westline_cart')?.maxAge).toBe(0);
  });
});
