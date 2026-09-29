'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      aria-label="Log out"
      className="flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-horizon disabled:opacity-60"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" fill="none" className="text-horizon">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" />
      </svg>
      <span className="hidden sm:inline">{loading ? 'Logging out…' : 'Log Out'}</span>
    </button>
  );
}
