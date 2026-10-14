import { WishlistSection } from '@/components/wishlist';
import type { ProductCard } from '@/shared/components/product-card/product-card';
import { styles } from './account.styles';
import { texts } from './account-texts';
import { SECTION_IDS } from './use-account-tab';

interface AccountOverviewProps {
  /** The saved products, newest first (wishlist spec). */
  wishlist: ProductCard[];
}

/**
 * The My Account tab (design `#panelWishlist` + `#panelOrders`): the wishlist, then the order
 * history head and empty state. The order-history spec fills the second section with data.
 */
export function AccountOverview({ wishlist }: AccountOverviewProps) {
  return (
    <>
      <WishlistSection id={SECTION_IDS.wishlist} items={wishlist} />

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
