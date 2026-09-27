import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookieOptions, SESSION_COOKIE_NAME } from '@/lib/auth/session';
import { MIN_PASSWORD_LENGTH, PASSWORD_TOO_SHORT_MESSAGE } from '@/lib/auth/password';

const STRAPI_URL = process.env.STRAPI_URL ?? 'http://localhost:1337';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const { firstName, lastName, email, password } = body ?? {};

  if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json({ error: { message: PASSWORD_TOO_SHORT_MESSAGE } }, { status: 400 });
  }

  const strapiResponse = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: email, email, password, firstName, lastName }),
  });

  const data = await strapiResponse.json();

  if (!strapiResponse.ok) {
    return NextResponse.json(
      { error: { message: data?.error?.message ?? 'Registration failed.' } },
      { status: strapiResponse.status }
    );
  }

  const response = NextResponse.json({ user: data.user }, { status: 200 });
  response.cookies.set(SESSION_COOKIE_NAME, data.jwt, getSessionCookieOptions());
  return response;
}
