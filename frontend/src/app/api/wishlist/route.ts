import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { NO_STORE } from '@/lib/cart/route-helpers';
import { getWishlist } from '@/lib/strapi/wishlist';

export const dynamic = 'force-dynamic';

const json = (body: unknown, status: number) => NextResponse.json(body, { status, headers: NO_STORE });

/** The signed-in shopper's saved products, as product cards (newest first). */
export async function GET(request: NextRequest) {
  const jwt = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return json({ error: { code: 'unauthorized' } }, 401);

  const items = await getWishlist(jwt);
  return items ? json({ items }, 200) : json({ error: { code: 'failed' } }, 502);
}
