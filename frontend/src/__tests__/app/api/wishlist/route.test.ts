// @vitest-environment node
import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getWishlist: vi.fn(), addToWishlist: vi.fn(), removeFromWishlist: vi.fn() }));
vi.mock('@/lib/strapi/wishlist', () => mocks);

import { GET } from '@/app/api/wishlist/route';
import { DELETE, PUT } from '@/app/api/wishlist/items/[slug]/route';

const CARD = { slug: 'samurai', name: 'Samurai', price: 79, href: '/products/samurai', images: [], imageFit: 'cover' };

const request = (path: string, method: string, session = true) =>
  new NextRequest(`http://localhost${path}`, { method, headers: session ? { cookie: 'westline_session=jwt-1' } : {} });

describe('GET /api/wishlist (wishlist AC5, AC11)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('answers 401 without a session, without calling Strapi', async () => {
    const response = await GET(request('/api/wishlist', 'GET', false));
    expect(response.status).toBe(401);
    expect(mocks.getWishlist).not.toHaveBeenCalled();
  });

  it("returns the user's cards, uncached", async () => {
    mocks.getWishlist.mockResolvedValue([CARD]);
    const response = await GET(request('/api/wishlist', 'GET'));
    expect(mocks.getWishlist).toHaveBeenCalledWith('jwt-1');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({ items: [CARD] });
  });

  it('answers 502 when Strapi fails', async () => {
    mocks.getWishlist.mockResolvedValue(null);
    expect((await GET(request('/api/wishlist', 'GET'))).status).toBe(502);
  });
});

describe('PUT / DELETE /api/wishlist/items/[slug] (wishlist AC4, AC9, AC11)', () => {
  beforeEach(() => vi.clearAllMocks());

  const put = (slug: string, session = true) => PUT(request(`/api/wishlist/items/${slug}`, 'PUT', session), { params: { slug } });
  const del = (slug: string, session = true) =>
    DELETE(request(`/api/wishlist/items/${slug}`, 'DELETE', session), { params: { slug } });

  it('answers 401 without a session, without calling Strapi', async () => {
    expect((await put('samurai', false)).status).toBe(401);
    expect((await del('samurai', false)).status).toBe(401);
    expect(mocks.addToWishlist).not.toHaveBeenCalled();
    expect(mocks.removeFromWishlist).not.toHaveBeenCalled();
  });

  it('answers 400 for a malformed slug, without calling Strapi', async () => {
    const response = await put('Not%20A%20Slug');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: { code: 'bad-request' } });
    expect(mocks.addToWishlist).not.toHaveBeenCalled();
  });

  it('adds and removes for the session user', async () => {
    mocks.addToWishlist.mockResolvedValue('ok');
    mocks.removeFromWishlist.mockResolvedValue('ok');

    const added = await put('samurai');
    expect(mocks.addToWishlist).toHaveBeenCalledWith('jwt-1', 'samurai');
    expect(added.status).toBe(200);
    expect(added.headers.get('cache-control')).toBe('no-store');

    expect((await del('samurai')).status).toBe(200);
    expect(mocks.removeFromWishlist).toHaveBeenCalledWith('jwt-1', 'samurai');
  });

  it.each([
    ['unauthorized', 401],
    ['not-found', 404],
    ['failed', 502],
  ])('maps %s to %s', async (result, status) => {
    mocks.addToWishlist.mockResolvedValue(result);
    const response = await put('samurai');
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error: { code: result } });
  });
});
