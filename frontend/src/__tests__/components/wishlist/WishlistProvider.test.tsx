import { act, renderHook, waitFor } from '@testing-library/react';
import { useEffect, type ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { WishlistProvider } from '@/components/wishlist/WishlistProvider';
import { useWishlist } from '@/components/wishlist/wishlist-context';
import { PENDING_KEY, markPending } from '@/lib/wishlist/pending';

const nav = vi.hoisted(() => ({ router: { push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }, pathname: '/products' }));
vi.mock('next/navigation', () => ({ useRouter: () => nav.router, usePathname: () => nav.pathname }));

const mockFetch = vi.fn();
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const card = (slug: string) => ({ slug, name: slug, price: 1, href: `/products/${slug}`, images: [], imageFit: 'cover' });

function setUrl(url: string) {
  window.history.replaceState(null, '', url);
  nav.pathname = new URL(url, 'http://localhost').pathname;
}

function setup(signedIn: boolean) {
  const wrapper = ({ children }: { children: ReactNode }) => <WishlistProvider signedIn={signedIn}>{children}</WishlistProvider>;
  return renderHook(() => useWishlist(), { wrapper });
}

const calls = (method: string) => mockFetch.mock.calls.filter(([, init]) => (init?.method ?? 'GET') === method);

describe('WishlistProvider (wishlist AC1, AC3, AC4, AC8)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.clearAllMocks();
    window.sessionStorage.clear();
    setUrl('/products?page=2');
  });

  afterEach(() => vi.unstubAllGlobals());

  it("loads a signed-in shopper's saved slugs", async () => {
    mockFetch.mockResolvedValue(respond({ items: [card('samurai'), card('tideline')] }));
    const { result } = setup(true);

    await waitFor(() => expect(result.current.isSaved('samurai')).toBe(true));
    expect(result.current.isSaved('tideline')).toBe(true);
    expect(result.current.isSaved('other')).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith('/api/wishlist', { cache: 'no-store' });
  });

  it('loads nothing for a guest', () => {
    const { result } = setup(false);
    expect(result.current.isSaved('samurai')).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('a seed from the server-rendered list replaces the load (account page)', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => <WishlistProvider signedIn>{children}</WishlistProvider>;
    const { result } = renderHook(
      () => {
        const value = useWishlist();
        // As WishlistSection does: a child effect, which runs before the provider's load effect.
        useEffect(() => value.seed(['seeded']), [value]);
        return value;
      },
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSaved('seeded')).toBe(true));
    expect(calls('GET')).toHaveLength(0);
  });

  it('saves optimistically and keeps it on success (AC1)', async () => {
    mockFetch.mockResolvedValueOnce(respond({ items: [] }));
    const { result } = setup(true);
    await waitFor(() => expect(calls('GET')).toHaveLength(1));

    let resolve: (response: Response) => void = () => {};
    mockFetch.mockReturnValueOnce(new Promise<Response>((r) => (resolve = r)));
    let done: Promise<boolean> = Promise.resolve(false);
    act(() => {
      done = result.current.toggle('samurai');
    });
    expect(result.current.isSaved('samurai')).toBe(true);
    expect(calls('PUT')[0][0]).toBe('/api/wishlist/items/samurai');

    await act(async () => resolve(respond({ ok: true })));
    await expect(done).resolves.toBe(true);
    expect(result.current.isSaved('samurai')).toBe(true);
  });

  it('removes a saved product, and reverts quietly when the request fails (AC8)', async () => {
    mockFetch.mockResolvedValueOnce(respond({ items: [card('samurai')] }));
    const { result } = setup(true);
    await waitFor(() => expect(result.current.isSaved('samurai')).toBe(true));

    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'failed' } }, 502));
    let ok = true;
    await act(async () => {
      ok = await result.current.toggle('samurai');
    });
    expect(calls('DELETE')[0][0]).toBe('/api/wishlist/items/samurai');
    expect(ok).toBe(false);
    expect(result.current.isSaved('samurai')).toBe(true);
    expect(nav.router.push).not.toHaveBeenCalled();

    mockFetch.mockRejectedValueOnce(new Error('offline'));
    await act(async () => {
      await result.current.toggle('samurai');
    });
    expect(result.current.isSaved('samurai')).toBe(true);
  });

  it("sends a guest's heart to sign in with the marker and ?wishlist= on the current URL (AC3)", async () => {
    const { result } = setup(false);

    await act(async () => {
      await result.current.toggle('samurai');
    });

    expect(mockFetch).not.toHaveBeenCalled();
    expect(nav.router.push).toHaveBeenCalledWith('/auth/login?next=%2Fproducts%3Fpage%3D2%26wishlist%3Dsamurai');
    expect(JSON.parse(window.sessionStorage.getItem(PENDING_KEY) ?? '{}')).toMatchObject({ slug: 'samurai' });
  });

  it('treats a 401 on save like a guest click, reverting the heart (AC8)', async () => {
    mockFetch.mockResolvedValueOnce(respond({ items: [] }));
    const { result } = setup(true);
    await waitFor(() => expect(calls('GET')).toHaveLength(1));

    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'unauthorized' } }, 401));
    await act(async () => {
      await result.current.toggle('samurai');
    });

    expect(result.current.isSaved('samurai')).toBe(false);
    expect(nav.router.push).toHaveBeenCalledWith('/auth/login?next=%2Fproducts%3Fpage%3D2%26wishlist%3Dsamurai');
    expect(window.sessionStorage.getItem(PENDING_KEY)).not.toBeNull();
  });

  it('sends a 401 on remove to sign in, returning to the same page without a pending save (AC8)', async () => {
    mockFetch.mockResolvedValueOnce(respond({ items: [card('samurai')] }));
    const { result } = setup(true);
    await waitFor(() => expect(result.current.isSaved('samurai')).toBe(true));

    mockFetch.mockResolvedValueOnce(respond({ error: { code: 'unauthorized' } }, 401));
    await act(async () => {
      await result.current.toggle('samurai');
    });

    expect(result.current.isSaved('samurai')).toBe(true);
    expect(nav.router.push).toHaveBeenCalledWith('/auth/login?next=%2Fproducts%3Fpage%3D2');
    expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull();
  });

  it('ignores a malformed slug', async () => {
    const { result } = setup(false);
    await act(async () => {
      await result.current.toggle('../evil');
    });
    expect(nav.router.push).not.toHaveBeenCalled();
  });

  describe('landing back from sign-in (AC3, AC4)', () => {
    it('saves the marked product and strips ?wishlist= without a history entry', async () => {
      setUrl('/products?page=2&wishlist=samurai');
      markPending('samurai');
      mockFetch.mockImplementation((_url: string, init?: RequestInit) =>
        Promise.resolve(init?.method === 'PUT' ? respond({ ok: true }) : respond({ items: [] }))
      );

      const { result } = setup(true);

      await waitFor(() => expect(calls('PUT')).toHaveLength(1));
      expect(calls('PUT')[0][0]).toBe('/api/wishlist/items/samurai');
      expect(nav.router.replace).toHaveBeenCalledWith('/products?page=2', { scroll: false });
      await waitFor(() => expect(result.current.isSaved('samurai')).toBe(true));
      expect(window.sessionStorage.getItem(PENDING_KEY)).toBeNull();
    });

    it('saves nothing without the marker, but still strips the param', async () => {
      setUrl('/products?wishlist=samurai');
      mockFetch.mockResolvedValue(respond({ items: [] }));

      setup(true);

      await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith('/products', { scroll: false }));
      expect(calls('PUT')).toHaveLength(0);
    });

    it('saves nothing for a marker on a different product', async () => {
      setUrl('/products?wishlist=samurai');
      markPending('tideline');
      mockFetch.mockResolvedValue(respond({ items: [] }));

      setup(true);

      await waitFor(() => expect(nav.router.replace).toHaveBeenCalled());
      expect(calls('PUT')).toHaveLength(0);
    });

    it('never sends a malformed slug, even with a marker', async () => {
      setUrl('/products?wishlist=..%2Fevil');
      markPending('../evil');
      mockFetch.mockResolvedValue(respond({ items: [] }));

      setup(true);

      await waitFor(() => expect(nav.router.replace).toHaveBeenCalledWith('/products', { scroll: false }));
      expect(calls('PUT')).toHaveLength(0);
    });

    it('waits while still signed out, keeping the param and the marker', () => {
      setUrl('/products?wishlist=samurai');
      markPending('samurai');

      setup(false);

      expect(nav.router.replace).not.toHaveBeenCalled();
      expect(window.sessionStorage.getItem(PENDING_KEY)).not.toBeNull();
    });
  });
});
