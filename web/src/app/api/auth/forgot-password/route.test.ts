// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockFetch = vi.fn();

function makeRequest(body: unknown) {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('proxies the email to Strapi and returns a generic ok response (AC11)', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ email: 'shopper@example.com' }));

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/forgot-password'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  it('still returns a generic ok response for Strapi\'s own 2xx anti-enumeration case (unknown email)', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ email: 'unknown@example.com' }));

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ok: true });
  });

  it('surfaces a real error when Strapi returns a non-2xx (e.g. email service misconfigured)', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ error: { message: 'The strapi.io domain is not verified' } }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    );

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ email: 'shopper@example.com' }));

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error.message).toMatch(/not verified/i);
  });

  it('surfaces a real error on a network failure reaching Strapi', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));

    const { POST } = await import('./route');
    const res = await POST(makeRequest({ email: 'shopper@example.com' }));

    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });
});
