// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('POST /api/auth/logout', () => {
  it('clears the session cookie and returns ok (AC7)', async () => {
    const { POST } = await import('./route');
    const res = await POST();

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);

    const cookie = res.cookies.get('westline_session');
    expect(cookie?.value).toBe('');

    const setCookieHeader = res.headers.get('set-cookie');
    expect(setCookieHeader).toMatch(/westline_session=;/);
  });
});
