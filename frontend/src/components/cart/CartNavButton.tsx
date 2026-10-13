'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@/shared/components/icons';
import { isCartPath } from './cart';
import { useCart } from './cart-context';
import { styles } from './cart-nav-button.styles';
import { texts } from './cart-texts';

/** Header bag: shows the unit count and toggles the cart drawer (not on /cart itself). */
export const CartNavButton = (): React.JSX.Element => {
  const { cart, status, drawerOpen, toggleDrawer } = useCart();
  const pathname = usePathname();
  const showCount = status === 'ready' && cart.count > 0;

  return (
    <button
      type="button"
      aria-label={showCount ? texts.cartWithCount(cart.count) : texts.cart}
      aria-haspopup="dialog"
      aria-expanded={drawerOpen}
      onClick={() => {
        if (!isCartPath(pathname)) toggleDrawer();
      }}
      className={styles.button}
    >
      <Icon name="cart" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
      {showCount && (
        <span data-cart-count aria-hidden className={styles.count}>
          {cart.count}
        </span>
      )}
    </button>
  );
};
