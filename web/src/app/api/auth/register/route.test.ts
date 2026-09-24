// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('rejects a password under 8 characters without calling Strapi (AC3)', async () => {
    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com', password: 'short' })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/8 characters/i);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('registers, sets an httpOnly session cookie, and returns the user on success (AC1, AC6)', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          jwt: 'a.jwt.token',
          user: { id: 1, email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com', password: 'password123' })
    );

    expect(res.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/local/register'),
      expect.objectContaining({ method: 'POST' })
    );

    const setCookie = res.cookies.get('westline_session');
    expect(setCookie?.value).toBe('a.jwt.token');
    expect(setCookie?.httpOnly).toBe(true);

    const json = await res.json();
    expect(json.user.email).toBe('jamie@example.com');
    expect(json.jwt).toBeUndefined();
  });

  it('passes through a duplicate-email error from Strapi without setting a cookie (AC2)', async () => {
    mockFetch.mockResolvedValue(
      new Response(
        JSON.stringify({ error: { message: 'Email or Username are already taken' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const { POST } = await import('./route');
    const res = await POST(
      makeRequest({ firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com', password: 'password123' })
    );

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.message).toMatch(/already taken/i);
    expect(res.cookies.get('westline_session')).toBeUndefined();
  });
});
