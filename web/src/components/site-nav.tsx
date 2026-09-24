import Link from 'next/link';
import { getSession } from '@/lib/auth/session';
import { LogoutButton } from './logout-button';

export function SiteNav() {
  const session = getSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-white py-3.5">
      <div className="mx-auto flex max-w-[1240px] items-center justify-between gap-5 px-6">
        <Link href="/" className="font-display text-xl font-extrabold uppercase tracking-wide text-ink">
          WESTLINE
        </Link>
        {session ? (
          <LogoutButton />
        ) : (
          <Link
            href="/login"
            aria-label="Account"
            className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-horizon"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" fill="none">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" />
            </svg>
            <span className="hidden sm:inline">Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
