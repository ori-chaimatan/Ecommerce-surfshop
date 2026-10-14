import { OrderHistorySection } from '@/components/order-history';
import { WishlistSection } from '@/components/wishlist';
import type { StrapiOrder } from '@/lib/strapi/orders';
import type { ProductCard } from '@/shared/components/product-card/product-card';
import { SECTION_IDS } from './use-account-tab';

interface AccountOverviewProps {
  /** The saved products, newest first (wishlist spec). */
  wishlist: ProductCard[];
  /** The shopper's orders, newest first (order-history spec). */
  orders: StrapiOrder[];
}

/** The My Account tab (design `#panelWishlist` + `#panelOrders`): the wishlist, then the order history. */
export function AccountOverview({ wishlist, orders }: AccountOverviewProps) {
  return (
    <>
      <WishlistSection id={SECTION_IDS.wishlist} items={wishlist} />
      <OrderHistorySection id={SECTION_IDS.orders} orders={orders} />
    </>
  );
}
