'use client';

import Link from 'next/link';
import { ProductBreadcrumb } from '@/components/product-detail/shared/ProductBreadcrumb';
import { CONTAINER } from '@/components/product-detail/shared/layout';
import { HOME_HREF, PRODUCTS_HREF } from '@/lib/routes';
import { useCart } from './cart-context';
import { styles } from './cart-page.styles';
import { sharedStyles } from './cart-shared.styles';
import { texts } from './cart-texts';
import { CartLines } from './CartLines';
import { CartSummary } from './CartSummary';
import { ShippingProgress } from './ShippingProgress';

const BREADCRUMB = [{ label: texts.home, href: HOME_HREF }, { label: texts.cart }];

/** `/cart` (design `cart.html`): lines on the left, the sticky order summary on the right. */
export const CartPage = (): React.JSX.Element => {
  const { cart, status, reload } = useCart();

  return (
    <main className={styles.page}>
      <ProductBreadcrumb items={BREADCRUMB} />
      <div className={CONTAINER}>
        <h1 className={styles.title}>
          {texts.pageTitle}
        </h1>

        {status === 'loading' ? (
          <div aria-busy="true" aria-label={texts.loading} className={styles.skeleton}>
            <div className={styles.skeletonColumn}>
              <div className={`${styles.skeletonBlock.height.banner} ${styles.skeletonBlock.base}`} />
              <div className={`${styles.skeletonBlock.height.line} ${styles.skeletonBlock.base}`} />
              <div className={`${styles.skeletonBlock.height.line} ${styles.skeletonBlock.base}`} />
            </div>
            <div className={`${styles.skeletonBlock.height.summary} ${styles.skeletonBlock.base}`} />
          </div>
        ) : status === 'error' ? (
          <div className={styles.message}>
            <p className={styles.messageText}>{texts.loadFailed}</p>
            <button type="button" onClick={() => void reload()} className={styles.retry}>
              {texts.retry}
            </button>
          </div>
        ) : cart.isEmpty ? (
          <div className={styles.message}>
            <CartLines variant="page" />
            <p className={styles.messageText}>{texts.empty}</p>
            <Link href={PRODUCTS_HREF} className={`${sharedStyles.secondaryButton} ${styles.continueShopping}`}>
              {texts.continueShopping}
            </Link>
          </div>
        ) : (
          <div data-cart-grid className={styles.grid}>
            <section>
              <ShippingProgress remaining={cart.remainingForFreeShipping} progress={cart.freeShippingProgress} variant="page" />
              <CartLines variant="page" />
            </section>
            <CartSummary />
          </div>
        )}
      </div>
    </main>
  );
};
