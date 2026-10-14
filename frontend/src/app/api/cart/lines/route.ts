import type { NextRequest } from 'next/server';
import { readCartIdentity } from '@/lib/cart/cookie';
import { badRequest, readLineInput, respondAsShopper, tooManyRequests } from '@/lib/cart/route-helpers';
import { cartCreationLimiter, clientIp } from '@/lib/rate-limit';
import { addCartLine, removeCartLine, setCartLineQty } from '@/lib/strapi/cart';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Only a request that would create a new guest cart counts against the limit.
  const { jwt, token } = readCartIdentity(request);
  if (!jwt && !token) {
    const limit = cartCreationLimiter.hit(clientIp(request));
    if (!limit.ok) return tooManyRequests(limit.retryAfter);
  }

  const line = await readLineInput(request, false);
  return line ? respondAsShopper(request, (identity) => addCartLine(identity, line)) : badRequest();
}

export async function PATCH(request: NextRequest) {
  const line = await readLineInput(request, true);
  return line ? respondAsShopper(request, (identity) => setCartLineQty(identity, line)) : badRequest();
}

export async function DELETE(request: NextRequest) {
  const line = await readLineInput(request, false);
  return line ? respondAsShopper(request, (identity) => removeCartLine(identity, line)) : badRequest();
}
