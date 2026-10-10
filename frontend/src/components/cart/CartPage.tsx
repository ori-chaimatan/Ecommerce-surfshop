'use client';

import Link from 'next/link';
import { ProductBreadcrumb } from '@/components/product-detail/shared/ProductBreadcrumb';
import { CONTAINER } from '@/components/product-detail/shared/layout';
import { HOME_HREF, PRODUCTS_HREF } from '@/lib/routes';
import { SECONDARY_BUTTON } from './cart';
import { useCart } from './cart-context';
import { texts } from './cart-texts';
import { CartLines } from './CartLines';
import { CartSummary } from './CartSummary';
import { ShippingProgress } from './ShippingProgress';

const BREADCRUMB = [{ label: texts.home, href: HOME_HREF }, { label: texts.cart }];
const SKELETON_BLOCK = 'animate-pulse rounded-[9px] bg-background motion-reduce:animate-none';

/** `/cart` (design `cart.html`): lines on the left, the sticky order summary on the right. */
export function CartPage() {
  const { cart, status, reload } = useCart();

  return (
    <main className="pb-20">
      <ProductBreadcrumb items={BREADCRUMB} />
      <div className={CONTAINER}>
        <h1 className="mb-7 mt-1 font-display text-[clamp(28px,4vw,42px)] font-extrabold uppercase leading-[0.95] text-ink">
          {texts.pageTitle}
        </h1>

        {status === 'loading' ? (
          <div aria-busy="true" aria-label={texts.loading} className="grid grid-cols-[1.7fr_1fr] gap-12 max-[900px]:grid-cols-1">
            <div className="flex flex-col gap-6">
              <div className={`h-16 ${SKELETON_BLOCK}`} />
              <div className={`h-[138px] ${SKELETON_BLOCK}`} />
              <div className={`h-[138px] ${SKELETON_BLOCK}`} />
            </div>
            <div className={`h-72 ${SKELETON_BLOCK}`} />
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-start gap-4 py-12">
            <p className="text-[15px] text-muted">{texts.loadFailed}</p>
            <button type="button" onClick={() => void reload()} className="font-bold text-ink underline">
              {texts.retry}
            </button>
          </div>
        ) : cart.isEmpty ? (
          <div className="flex flex-col items-start gap-4 py-12">
            <CartLines variant="page" />
            <p className="text-[15px] text-muted">{texts.empty}</p>
            <Link href={PRODUCTS_HREF} className={`${SECONDARY_BUTTON} max-w-[220px]`}>
              {texts.continueShopping}
            </Link>
          </div>
        ) : (
          <div data-cart-grid className="grid grid-cols-[1.7fr_1fr] items-start gap-12 max-[900px]:grid-cols-1">
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
}
