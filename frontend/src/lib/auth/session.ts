import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const SESSION_COOKIE_NAME = 'westline_session';

/** Strapi's users-permissions JWTs live 30 days (`jwtManagement: 'legacy-support'`); the cookie matches. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

export interface Session {
  jwt: string;
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE,
  };
}

/**
 * Reads a JWT's `exp` claim without verifying it — Strapi verifies on every API call.
 * Returns undefined for a token with no `exp`, and null when the cookie isn't a JWT at all.
 */
function tokenExpiry(jwt: string): number | undefined | null {
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1] ?? '', 'base64url').toString('utf8'));
    if (typeof payload !== 'object' || payload === null) return null;
    return typeof payload.exp === 'number' ? payload.exp : undefined;
  } catch {
    return null;
  }
}

/** The signed-in session, or null when the cookie is missing, isn't a JWT, or its token has expired. */
export function getSession(): Session | null {
  const jwt = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!jwt) return null;

  const expiry = tokenExpiry(jwt);
  if (expiry === null || (expiry !== undefined && expiry * 1000 <= Date.now())) return null;
  return { jwt };
}

export function requireAuth(): Session {
  const session = getSession();
  if (!session) {
    redirect('/auth/login');
  }
  return session;
}
