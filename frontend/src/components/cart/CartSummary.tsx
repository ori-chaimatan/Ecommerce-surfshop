'use client';

import Link from 'next/link';
import { CHECKOUT_HREF, PRODUCTS_HREF } from '@/lib/routes';
import { ButtonCTA } from '@/shared/components/button-cta';
import { useCart } from './cart-context';
import { sharedStyles } from './cart-shared.styles';
import { styles } from './cart-summary.styles';
import { texts } from './cart-texts';

/** The cart page's sticky "Order Summary" (design `.cart-summary`). */
export const CartSummary = (): React.JSX.Element => {
  const { cart } = useCart();

  return (
    <aside className={styles.summary}>
      <h2 className={styles.title}>{texts.orderSummary}</h2>
      <div className={styles.row}>
        <span>{texts.subtotal}</span>
        <span className={styles.subtotal}>{cart.subtotal}</span>
      </div>
      <div className={styles.row}>
        <span>{texts.shipping}</span>
        <span>{texts.shippingAtCheckout}</span>
      </div>
      <div className={styles.totalRow}>
        <span>{texts.total}</span>
        <span>{cart.subtotal}</span>
      </div>
      {cart.hasBlockingLines && <p className={styles.blocking}>{texts.blocking}</p>}
      <div className={sharedStyles.fullWidthCta}>
        {cart.hasBlockingLines ? <ButtonCTA text={texts.checkout} disabled /> : <ButtonCTA text={texts.checkout} href={CHECKOUT_HREF} />}
      </div>
      <Link href={PRODUCTS_HREF} className={sharedStyles.secondaryButton}>
        {texts.continueShopping}
      </Link>
      <p className={styles.note}>{texts.summaryNote}</p>
    </aside>
  );
};
