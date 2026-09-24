// @vitest-environment node
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/oauth/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/oauth/complete', () => {
  it('sets an httpOnly session cookie from a posted jwt (AC21)', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ jwt: 'a.jwt.token' }));

    expect(res.status).toBe(200);
    const setCookie = res.cookies.get('westline_session');
    expect(setCookie?.value).toBe('a.jwt.token');
    expect(setCookie?.httpOnly).toBe(true);
  });

  it('rejects a missing jwt without setting a cookie', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({}));

    expect(res.status).toBe(400);
    expect(res.cookies.get('westline_session')).toBeUndefined();
  });

  it('rejects an empty-string jwt without setting a cookie', async () => {
    const { POST } = await import('./route');
    const res = await POST(makeRequest({ jwt: '' }));

    expect(res.status).toBe(400);
    expect(res.cookies.get('westline_session')).toBeUndefined();
  });
});
