import type { NextRequest } from 'next/server';
import { badRequest, readLineInput, respondAsShopper } from '@/lib/cart/route-helpers';
import { addCartLine, removeCartLine, setCartLineQty } from '@/lib/strapi/cart';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
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
