import Link from 'next/link';
import { categoryHref } from '@/lib/routes';
import { styles } from './account.styles';
import { texts } from './account-texts';
import { SECTION_IDS } from './use-account-tab';

/**
 * The My Account tab (design `#panelWishlist` + `#panelOrders`): section heads and empty states.
 * The wishlist and order-history specs fill these sections with data.
 */
export function AccountOverview() {
  return (
    <>
      <section id={SECTION_IDS.wishlist} aria-labelledby="account-wishlist-title" className={styles.section}>
        <div className={styles.sectionHead}>
          <h2 id="account-wishlist-title" className={styles.sectionTitle}>
            {texts.wishlist}
          </h2>
          <span className={styles.count}>{texts.savedCount(0)}</span>
        </div>
        <p className={styles.empty}>
          {texts.wishlistEmptyStart}
          <Link href={categoryHref('surfboards')} className={styles.emptyLink}>
            {texts.surfboards}
          </Link>
          {texts.or}
          <Link href={categoryHref('clothing')} className={styles.emptyLink}>
            {texts.apparel}
          </Link>
          {texts.wishlistEmptyEnd}
        </p>
      </section>

      <section id={SECTION_IDS.orders} aria-labelledby="account-orders-title" className={styles.ordersSection}>
        <div className={styles.sectionHead}>
          <h2 id="account-orders-title" className={styles.sectionTitle}>
            {texts.orderHistory}
          </h2>
        </div>
        <p className={styles.empty}>{texts.ordersEmpty}</p>
      </section>
    </>
  );
}
