'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { HOME_HREF, LOGOUT_API_HREF } from '@/lib/routes';
import { styles } from './account.styles';
import { texts } from './account-texts';

const SPINNER = <span aria-hidden="true" className={styles.signOutSpinner} />;

/** The hero's Sign Out (design `#signOutBtn`): clears the session, then goes Home signed out. */
export function SignOutButton() {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch(LOGOUT_API_HREF, { method: 'POST' });
    } catch {
      setSigningOut(false);
      return;
    }
    router.push(HOME_HREF);
    router.refresh();
  }

  return (
    <button type="button" className={styles.signOut} onClick={signOut} disabled={signingOut}>
      {signingOut && SPINNER}
      <span>{signingOut ? texts.signingOut : texts.signOut}</span>
    </button>
  );
}
