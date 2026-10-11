import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { withGuestCartMerge } from '@/lib/cart/merge-on-auth';
import { NEXT_COOKIE_NAME, safeNextPath } from '@/lib/auth/next-path';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { jwt } = body ?? {};

  if (typeof jwt !== 'string' || !jwt) {
    return NextResponse.json({ error: { message: 'Missing token.' } }, { status: 400 });
  }

  // Where Google sign-in should land, remembered by /api/auth/google (checkout's ?next=).
  const next = safeNextPath(request.cookies.get(NEXT_COOKIE_NAME)?.value);
  const response = NextResponse.json({ ok: true, next }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, jwt, getSessionCookieOptions());
  response.cookies.delete(NEXT_COOKIE_NAME);
  return withGuestCartMerge(request, response, jwt);
}
