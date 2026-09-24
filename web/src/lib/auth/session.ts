import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE_NAME = 'westline_session';

export interface Session {
  jwt: string;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

export function getSession(): Session | null {
  const jwt = cookies().get(SESSION_COOKIE_NAME)?.value;
  return jwt ? { jwt } : null;
}

export function requireAuth(): Session {
  const session = getSession();
  if (!session) {
    redirect('/login');
  }
  return session;
}
