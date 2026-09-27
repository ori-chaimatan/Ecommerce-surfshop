import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { jwt } = body ?? {};

  if (typeof jwt !== 'string' || !jwt) {
    return NextResponse.json({ error: { message: 'Missing token.' } }, { status: 400 });
  }

  const response = NextResponse.json({ ok: true }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, jwt, getSessionCookieOptions());
  return response;
}
