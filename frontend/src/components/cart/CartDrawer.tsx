'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { CART_HREF, CHECKOUT_HREF, PRODUCTS_HREF } from '@/lib/routes';
import { ButtonCTA } from '@/shared/components/button-cta';
import { Icon } from '@/shared/components/icons';
import { useCart } from './cart-context';
import { styles } from './cart-drawer.styles';
import { sharedStyles } from './cart-shared.styles';
import { texts } from './cart-texts';
import { CartLines } from './CartLines';
import { ShippingProgress } from './ShippingProgress';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The right-side cart drawer (design `.cart-drawer`). Opened by Add to Cart and the header
 * bag; closes on X, the overlay, Escape and navigation. The provider returns focus to
 * whatever opened it.
 */
export const CartDrawer = (): React.JSX.Element | null => {
  const { cart, status, drawerOpen, closeDrawer, reload } = useCart();
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastPathname = useRef(pathname);

  useEffect(() => {
    if (lastPathname.current === pathname) return;
    lastPathname.current = pathname;
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    if (!drawerOpen) return;

    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDrawer();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const outside = !dialogRef.current.contains(active);

      if (event.shiftKey && (active === first || outside)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && (active === last || outside)) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [drawerOpen, closeDrawer]);

  return drawerOpen ? (
    <>
      <div
        data-testid="cart-overlay"
        aria-hidden
        onClick={closeDrawer}
        className={styles.overlay}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={texts.cart}
        className={styles.drawer}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{texts.drawerTitle(cart.count)}</h2>
          <button ref={closeRef} type="button" aria-label={texts.closeCart} onClick={closeDrawer} className={styles.close}>
            <Icon name="close" className={styles.closeIcon} />
          </button>
        </div>

        {status === 'loading' ? (
          <p className={styles.loading}>{texts.loading}</p>
        ) : status === 'error' ? (
          <div className={styles.error}>
            <p>{texts.loadFailed}</p>
            <button type="button" onClick={() => void reload()} className={styles.retry}>
              {texts.retry}
            </button>
          </div>
        ) : cart.isEmpty ? (
          <div className={styles.empty}>
            <CartLines variant="drawer" onNavigate={closeDrawer} />
            <p>{texts.empty}</p>
            <Link href={PRODUCTS_HREF} onClick={closeDrawer} className={`${sharedStyles.secondaryButton} ${styles.continueShopping}`}>
              {texts.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <ShippingProgress remaining={cart.remainingForFreeShipping} progress={cart.freeShippingProgress} variant="drawer" />
            <div className={styles.lines}>
              <CartLines variant="drawer" onNavigate={closeDrawer} />
            </div>
            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span>{texts.subtotal}</span>
                <span className={styles.subtotal}>{cart.subtotal}</span>
              </div>
              {cart.hasBlockingLines && <p className={styles.blocking}>{texts.blocking}</p>}
              {/* Following a link closes the drawer even when it points at the current page. */}
              <div className={sharedStyles.fullWidthCta} onClick={closeDrawer}>
                <ButtonCTA text={texts.viewCart} href={CART_HREF} />
              </div>
              {cart.hasBlockingLines ? (
                <div className={sharedStyles.fullWidthCta}>
                  <ButtonCTA text={texts.checkout} disabled />
                </div>
              ) : (
                <div className={sharedStyles.fullWidthCta} onClick={closeDrawer}>
                  <ButtonCTA text={texts.checkout} href={CHECKOUT_HREF} />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  ) : null;
};
