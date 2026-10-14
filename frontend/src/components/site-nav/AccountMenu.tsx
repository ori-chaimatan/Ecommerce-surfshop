'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, type MouseEvent } from 'react';
import { ACCOUNT_HREF, HOME_HREF, LOGOUT_API_HREF, WISHLIST_HREF } from '@/lib/routes';
import { Icon } from '@/shared/components/icons';
import { styles } from './account-menu.styles';
import { texts } from './site-nav-texts';

const WISHLIST_HASH = WISHLIST_HREF.slice(WISHLIST_HREF.indexOf('#'));

/**
 * The signed-in account icon: a small dropdown with My Account, Wishlist and Sign Out
 * (product decision, not in the design). Closes on outside click, Escape, a pick, or a route change.
 */
export const AccountMenu = (): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Already on My Account: Next's same-page navigation doesn't fire hashchange, which the tabs listen to.
  function openWishlist(event: MouseEvent) {
    setOpen(false);
    if (window.location.pathname !== ACCOUNT_HREF) return;
    event.preventDefault();
    if (window.location.hash === WISHLIST_HASH) window.dispatchEvent(new HashChangeEvent('hashchange'));
    else window.location.hash = WISHLIST_HASH;
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch(LOGOUT_API_HREF, { method: 'POST' });
    } catch {
      setSigningOut(false);
      return;
    }
    setOpen(false);
    setSigningOut(false);
    router.push(HOME_HREF);
    router.refresh();
  }

  return (
    <div
      ref={rootRef}
      className={styles.root}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        aria-label={texts.accountLabel}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={styles.trigger}
      >
        <Icon name="account" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
      </button>
      {open && (
        <ul id={menuId} role="menu" aria-label={texts.accountLabel} className={styles.menu}>
          <li role="none">
            <Link role="menuitem" href={ACCOUNT_HREF} onClick={() => setOpen(false)} className={styles.item}>
              {texts.myAccount}
            </Link>
          </li>
          <li role="none">
            <Link role="menuitem" href={WISHLIST_HREF} onClick={openWishlist} className={styles.item}>
              {texts.wishlistLabel}
            </Link>
          </li>
          <li role="none" className={styles.divider}>
            <button role="menuitem" type="button" onClick={() => void signOut()} disabled={signingOut} className={styles.item}>
              {signingOut ? texts.signingOut : texts.signOut}
            </button>
          </li>
        </ul>
      )}
    </div>
  );
};
