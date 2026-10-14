/**
 * Where to go after signing in (`?next=`). Only same-site paths are honoured, so the param
 * can't be used as an open redirect; anything else goes home.
 */

/** Carries `next` through Google sign-in, which leaves the site. */
export const NEXT_COOKIE_NAME = 'westline_next';
export const NEXT_COOKIE_MAX_AGE = 60 * 10;

const isSameSitePath = (path: string) => path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/\\');

export function safeNextPath(value: string | null | undefined): string {
  if (typeof value !== 'string' || !isSameSitePath(value) || /[\u0000-\u001f\u007f]/.test(value)) return '/';

  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return '/';
  }
  return isSameSitePath(decoded) ? value : '/';
}

/** The `next` page prop as a safe path, or undefined when there's nothing worth carrying. */
export function nextFromSearchParams(searchParams?: { next?: string | string[] }): string | undefined {
  const next = typeof searchParams?.next === 'string' ? safeNextPath(searchParams.next) : '/';
  return next === '/' ? undefined : next;
}
