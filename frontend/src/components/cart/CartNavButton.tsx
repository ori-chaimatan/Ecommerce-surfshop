'use client';

import { usePathname } from 'next/navigation';
import { Icon } from '@/shared/components/icons';
import { isCartPath } from './cart';
import { useCart } from './cart-context';
import { texts } from './cart-texts';

/** Header bag: shows the unit count and toggles the cart drawer (not on /cart itself). */
export function CartNavButton() {
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
      className="relative flex p-1.5 text-ink hover:text-horizon"
    >
      <Icon name="cart" width="20" height="20" stroke="currentColor" strokeWidth="1.7" fill="none" />
      {showCount && (
        <span
          data-cart-count
          aria-hidden
          className="absolute -right-1 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-horizon px-1 font-mono text-[10px] leading-none text-white"
        >
          {cart.count}
        </span>
      )}
    </button>
  );
}
