'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { CART_HREF, PRODUCTS_HREF } from '@/lib/routes';
import { ButtonCTA } from '@/shared/components/button-cta';
import { Icon } from '@/shared/components/icons';
import { FULL_WIDTH_CTA, SECONDARY_BUTTON } from './cart';
import { useCart } from './cart-context';
import { texts } from './cart-texts';
import { CartLines } from './CartLines';
import { ShippingProgress } from './ShippingProgress';

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * The right-side cart drawer (design `.cart-drawer`). Opened by Add to Cart and the header
 * bag; closes on X, the overlay, Escape and navigation. The provider returns focus to
 * whatever opened it.
 */
export function CartDrawer() {
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
        className="fixed inset-0 z-[60] animate-fade-in bg-[rgba(18,33,42,.5)] motion-reduce:animate-none"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={texts.cart}
        className="fixed inset-y-0 right-0 z-[61] flex w-[420px] max-w-full animate-drawer-in flex-col bg-white shadow-[-8px_0_24px_rgba(18,33,42,.12)] motion-reduce:animate-none max-[480px]:w-full"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-base font-bold text-ink">{texts.drawerTitle(cart.count)}</h2>
          <button ref={closeRef} type="button" aria-label={texts.closeCart} onClick={closeDrawer} className="p-1 text-ink">
            <Icon name="close" className="h-[18px] w-[18px] fill-none stroke-current stroke-2" />
          </button>
        </div>

        {status === 'loading' ? (
          <p className="px-6 py-10 text-center text-sm text-muted">{texts.loading}</p>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-sm text-muted">
            <p>{texts.loadFailed}</p>
            <button type="button" onClick={() => void reload()} className="font-bold text-ink underline">
              {texts.retry}
            </button>
          </div>
        ) : cart.isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-10 text-center text-muted">
            <CartLines variant="drawer" />
            <p>{texts.empty}</p>
            <Link href={PRODUCTS_HREF} onClick={closeDrawer} className={`${SECONDARY_BUTTON} max-w-[230px]`}>
              {texts.continueShopping}
            </Link>
          </div>
        ) : (
          <>
            <ShippingProgress remaining={cart.remainingForFreeShipping} progress={cart.freeShippingProgress} variant="drawer" />
            <div className="flex-1 overflow-y-auto px-6 py-1">
              <CartLines variant="drawer" />
            </div>
            <div className="flex flex-col gap-2.5 border-t border-border px-6 py-5">
              <div className="mb-1 flex justify-between text-[14.5px] font-bold text-ink">
                <span>{texts.subtotal}</span>
                <span className="font-mono">{cart.subtotal}</span>
              </div>
              {cart.hasBlockingLines && <p className="text-xs text-danger">{texts.blocking}</p>}
              {/* Following a link closes the drawer even when it points at the current page. */}
              <div className={FULL_WIDTH_CTA} onClick={closeDrawer}>
                <ButtonCTA text={texts.viewCart} href={CART_HREF} />
              </div>
              <div className={FULL_WIDTH_CTA}>
                <ButtonCTA text={texts.checkout} disabled />
              </div>
              <p className="text-center text-xs text-muted">{texts.checkoutSoon}</p>
            </div>
          </>
        )}
      </div>
    </>
  ) : null;
}
