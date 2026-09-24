import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { email, password } = body ?? {};

  const strapiResponse = await fetch(`${STRAPI_URL}/api/auth/local`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  });

  const data = await strapiResponse.json();

  if (!strapiResponse.ok) {
    return NextResponse.json(
      { error: { message: 'Invalid email or password.' } },
      { status: strapiResponse.status }
    );
  }

  const response = NextResponse.json({ user: data.user }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, data.jwt, getSessionCookieOptions());
  return response;
}
