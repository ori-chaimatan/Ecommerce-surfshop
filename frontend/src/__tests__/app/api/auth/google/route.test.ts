// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { GET } from '@/app/api/auth/google/route';

describe('GET /api/auth/google (checkout AC17)', () => {
  it('remembers a safe next in a short-lived httpOnly cookie, then starts Google sign-in at Strapi', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/auth/google?next=%2Fcheckout'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toMatch(/\/api\/connect\/google$/);
    const cookie = res.cookies.get('westline_next');
    expect(cookie?.value).toBe('/checkout');
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('lax');
    expect(cookie?.maxAge).toBe(600);
  });

  it('stores nothing for an unsafe next', async () => {
    const res = await GET(new NextRequest('http://localhost:3000/api/auth/google?next=%2F%2Fevil.com'));
    expect(res.status).toBe(307);
    expect(res.cookies.get('westline_next')).toBeUndefined();
  });
});
