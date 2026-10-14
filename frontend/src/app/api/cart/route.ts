import type { NextRequest } from 'next/server';
import { respondAsShopper } from '@/lib/cart/route-helpers';
import { getCart } from '@/lib/strapi/cart';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return respondAsShopper(request, getCart);
}
