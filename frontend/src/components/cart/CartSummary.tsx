'use client';

import Link from 'next/link';
import { PRODUCTS_HREF } from '@/lib/routes';
import { ButtonCTA } from '@/shared/components/button-cta';
import { FULL_WIDTH_CTA, SECONDARY_BUTTON } from './cart';
import { useCart } from './cart-context';
import { texts } from './cart-texts';

const ROW = 'flex justify-between text-sm text-muted';

/** The cart page's sticky "Order Summary" (design `.cart-summary`). */
export function CartSummary() {
  const { cart } = useCart();

  return (
    <aside className="sticky top-[88px] flex flex-col gap-4 rounded-[9px] border border-border p-6 max-[900px]:static">
      <h2 className="text-[17px] font-bold text-ink">{texts.orderSummary}</h2>
      <div className={ROW}>
        <span>{texts.subtotal}</span>
        <span className="text-ink">{cart.subtotal}</span>
      </div>
      <div className={ROW}>
        <span>{texts.shipping}</span>
        <span>{texts.shippingAtCheckout}</span>
      </div>
      <div className="mt-0.5 flex justify-between border-t border-border pt-3.5 text-base font-bold text-ink">
        <span>{texts.total}</span>
        <span>{cart.subtotal}</span>
      </div>
      {cart.hasBlockingLines && <p className="text-xs text-danger">{texts.blocking}</p>}
      <div className={FULL_WIDTH_CTA}>
        <ButtonCTA text={texts.checkout} disabled />
      </div>
      <p className="-mt-2 text-center text-xs text-muted">{texts.checkoutSoon}</p>
      <Link href={PRODUCTS_HREF} className={SECONDARY_BUTTON}>
        {texts.continueShopping}
      </Link>
      <p className="text-xs text-muted">{texts.summaryNote}</p>
    </aside>
  );
}
