import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockGet = vi.fn();
const mockRedirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock('next/headers', () => ({
  cookies: () => ({ get: mockGet }),
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
}));

import { getSession, getSessionCookieOptions, requireAuth, SESSION_COOKIE_NAME } from '@/lib/auth/session';

const NOW = new Date('2026-10-10T12:00:00Z');
const nowSeconds = NOW.getTime() / 1000;

/** An unsigned JWT-shaped token: getSession only decodes, it never verifies. */
function token(payload: Record<string, unknown>) {
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${part({ alg: 'HS256', typ: 'JWT' })}.${part(payload)}.signature`;
}

const VALID = token({ id: 7, iat: nowSeconds - 60, exp: nowSeconds + 30 * 24 * 60 * 60 });
const EXPIRED = token({ id: 7, iat: nowSeconds - 700, exp: nowSeconds - 100 });

describe('getSession', () => {
  beforeEach(() => {
    mockGet.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when no session cookie is present', () => {
    mockGet.mockReturnValue(undefined);
    expect(getSession()).toBeNull();
  });

  it('returns the session when the cookie holds an unexpired token', () => {
    mockGet.mockReturnValue({ value: VALID });
    expect(getSession()).toEqual({ jwt: VALID });
    expect(mockGet).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });

  it('treats a token whose exp has passed as signed out (hotfix: session-expiry)', () => {
    mockGet.mockReturnValue({ value: EXPIRED });
    expect(getSession()).toBeNull();
  });

  it('treats a token expiring exactly now as signed out', () => {
    mockGet.mockReturnValue({ value: token({ id: 7, exp: nowSeconds }) });
    expect(getSession()).toBeNull();
  });

  it('treats a cookie that is not a decodable JWT as signed out', () => {
    for (const value of ['garbage', 'a.b.c', `x.${Buffer.from('not json').toString('base64url')}.y`, '']) {
      mockGet.mockReturnValue({ value });
      expect(getSession()).toBeNull();
    }
  });

  it('keeps a decodable token without an exp claim', () => {
    const noExp = token({ id: 7 });
    mockGet.mockReturnValue({ value: noExp });
    expect(getSession()).toEqual({ jwt: noExp });
  });
});

describe('getSessionCookieOptions', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('is httpOnly, lax, site-wide and kept for 30 days to match the token (hotfix: session-expiry)', () => {
    expect(getSessionCookieOptions()).toEqual({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  });

  it('is secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    expect(getSessionCookieOptions().secure).toBe(true);
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRedirect.mockClear();
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the session when authenticated', () => {
    mockGet.mockReturnValue({ value: VALID });
    expect(requireAuth()).toEqual({ jwt: VALID });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /auth/login when not authenticated', () => {
    mockGet.mockReturnValue(undefined);
    expect(() => requireAuth()).toThrow('REDIRECT:/auth/login');
    expect(mockRedirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to /auth/login when the token has expired', () => {
    mockGet.mockReturnValue({ value: EXPIRED });
    expect(() => requireAuth()).toThrow('REDIRECT:/auth/login');
  });
});
