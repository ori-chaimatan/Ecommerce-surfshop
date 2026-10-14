// @vitest-environment node
import { NextRequest, NextResponse } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { withGuestCartMerge } from '@/lib/cart/merge-on-auth';

const mockFetch = vi.fn();
let consoleError: ReturnType<typeof vi.spyOn>;

const request = (cookie?: string) =>
  new NextRequest('http://localhost/api/auth/login', { method: 'POST', headers: cookie ? { cookie } : {} });

describe('withGuestCartMerge (AC5)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('merges the guest cart into the new session and clears the guest cookie', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ lines: [], removedCount: 0 }), { status: 200 }));
    const response = NextResponse.json({ ok: true });

    const result = await withGuestCartMerge(request('westline_cart=tok'), response, 'new.jwt');

    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:1337/api/carts/merge',
      expect.objectContaining({ method: 'POST', headers: { Authorization: 'Bearer new.jwt', 'x-cart-token': 'tok' } })
    );
    const cleared = response.cookies.get('westline_cart');
    expect(cleared?.value).toBe('');
    expect(cleared?.maxAge).toBe(0);
  });

  it('does nothing without a guest cookie', async () => {
    const response = NextResponse.json({ ok: true });
    await withGuestCartMerge(request(), response, 'new.jwt');
    expect(mockFetch).not.toHaveBeenCalled();
    expect(response.cookies.get('westline_cart')).toBeUndefined();
  });

  it('logs a failed merge, keeps the guest cookie and never throws', async () => {
    mockFetch.mockResolvedValue(new Response('{}', { status: 500 }));
    const response = NextResponse.json({ ok: true });
    await expect(withGuestCartMerge(request('westline_cart=tok'), response, 'j')).resolves.toBe(response);
    expect(response.cookies.get('westline_cart')).toBeUndefined();
    expect(consoleError).toHaveBeenCalledWith('[cart] guest cart merge failed', 500);

    mockFetch.mockRejectedValue(new TypeError('fetch failed'));
    await expect(withGuestCartMerge(request('westline_cart=tok'), response, 'j')).resolves.toBe(response);
  });
});
