import { NextRequest, NextResponse } from 'next/server';
import { STRAPI_URL } from '@/lib/strapi/client';
import { NEXT_COOKIE_MAX_AGE, NEXT_COOKIE_NAME, safeNextPath } from '@/lib/auth/next-path';

/** Starts Google sign-in at Strapi, remembering `?next=` so oauth/complete can return there. */
export function GET(request: NextRequest) {
  const response = NextResponse.redirect(`${process.env.NEXT_PUBLIC_STRAPI_URL ?? STRAPI_URL}/api/connect/google`);
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));

  if (next !== '/') {
    response.cookies.set(NEXT_COOKIE_NAME, next, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: NEXT_COOKIE_MAX_AGE,
    });
  }
  return response;
}
