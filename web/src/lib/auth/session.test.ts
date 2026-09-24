import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { getSession, requireAuth, SESSION_COOKIE_NAME } from './session';

describe('getSession', () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it('returns null when no session cookie is present', () => {
    mockGet.mockReturnValue(undefined);
    expect(getSession()).toBeNull();
  });

  it('returns the session when the cookie is present', () => {
    mockGet.mockReturnValue({ value: 'a.jwt.token' });
    expect(getSession()).toEqual({ jwt: 'a.jwt.token' });
    expect(mockGet).toHaveBeenCalledWith(SESSION_COOKIE_NAME);
  });
});

describe('requireAuth', () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockRedirect.mockClear();
  });

  it('returns the session when authenticated', () => {
    mockGet.mockReturnValue({ value: 'a.jwt.token' });
    expect(requireAuth()).toEqual({ jwt: 'a.jwt.token' });
    expect(mockRedirect).not.toHaveBeenCalled();
  });

  it('redirects to /login when not authenticated', () => {
    mockGet.mockReturnValue(undefined);
    expect(() => requireAuth()).toThrow('REDIRECT:/login');
    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });
});
