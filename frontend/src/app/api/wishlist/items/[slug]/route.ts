import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { NO_STORE } from '@/lib/cart/route-helpers';
import { addToWishlist, removeFromWishlist, type WishlistWriteResult } from '@/lib/strapi/wishlist';
import { isWishlistSlug } from '@/lib/wishlist/slug';

export const dynamic = 'force-dynamic';

const STATUS: Record<WishlistWriteResult, number> = { ok: 200, unauthorized: 401, 'not-found': 404, failed: 502 };

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: NO_STORE });

interface Context {
  params: { slug: string };
}

/** Saves (PUT) or removes (DELETE) one product for the signed-in shopper. Both are idempotent. */
async function write(request: NextRequest, { params }: Context, action: typeof addToWishlist) {
  const jwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return json({ error: { code: 'unauthorized' } }, 401);
  if (!isWishlistSlug(params.slug)) return json({ error: { code: 'bad-request' } }, 400);

  const result = await action(jwt, params.slug);
  return result === 'ok' ? json({ ok: true }, 200) : json({ error: { code: result } }, STATUS[result]);
}

export const PUT = (request: NextRequest, context: Context) => write(request, context, addToWishlist);

export const DELETE = (request: NextRequest, context: Context) => write(request, context, removeFromWishlist);
