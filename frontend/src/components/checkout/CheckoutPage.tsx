'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useCart } from '@/components/cart/cart-context';
import { CART_HREF } from '@/lib/routes';
import type { Me } from '@/lib/strapi/account';
import { texts } from './checkout-texts';
import { CheckoutForm } from './CheckoutForm';
import { CheckoutSummary } from './CheckoutSummary';
import { usePlaceOrder } from './use-place-order';

const SKELETON_BLOCK = 'animate-pulse rounded-[9px] bg-surface motion-reduce:animate-none';

/**
 * `/checkout` (design `checkout.html`): the form on a white 58% column, the order summary on
 * a tinted 42% column; they stack below 900px. An empty cart goes back to `/cart`.
 */
export function CheckoutPage({ account }: { account: Me }) {
  const router = useRouter();
  const { cart, status, reload } = useCart();
  const checkout = usePlaceOrder(account);
  const empty = status === 'ready' && cart.isEmpty && !checkout.placed;

  useEffect(() => {
    if (empty) router.replace(CART_HREF);
  }, [empty, router]);

  return (
    <main className="flex items-stretch bg-white max-[900px]:flex-col">
      <div className="flex min-w-0 flex-[1_1_58%] justify-end bg-white px-[clamp(24px,4vw,64px)] pb-20 pt-8 max-[900px]:justify-stretch max-[900px]:px-4 max-[900px]:pb-0 max-[900px]:pt-6">
        <div className="w-full max-w-[640px] max-[900px]:max-w-none">
          <h1 className="mb-7 font-display text-[clamp(26px,3.6vw,38px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink">
            {texts.pageTitle}
          </h1>
          {status === 'loading' || empty ? (
            <div aria-busy="true" aria-label={texts.loading} className="flex flex-col gap-4">
              <div className={`h-24 ${SKELETON_BLOCK}`} />
              <div className={`h-72 ${SKELETON_BLOCK}`} />
              <div className={`h-48 ${SKELETON_BLOCK}`} />
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-start gap-4 py-12">
              <p className="text-[15px] text-muted">{texts.loadFailed}</p>
              <button type="button" onClick={() => void reload()} className="font-bold text-ink underline">
                {texts.retry}
              </button>
            </div>
          ) : (
            <CheckoutForm
              email={account.email}
              values={checkout.values}
              errors={checkout.errors}
              subtotalAmount={cart.subtotalAmount}
              submitting={checkout.submitting}
              blocked={cart.hasBlockingLines}
              alert={checkout.alert}
              alertRef={checkout.alertRef}
              fieldRef={checkout.fieldRef}
              onChange={checkout.setField}
              onSubmit={checkout.submit}
            />
          )}
        </div>
      </div>
      <aside className="flex min-w-0 flex-[1_1_42%] items-start border-l border-[#D6D6D6] bg-surface px-[clamp(24px,4vw,56px)] pb-20 pt-8 max-[900px]:items-stretch max-[900px]:border-l-0 max-[900px]:border-t max-[900px]:px-4 max-[900px]:pb-10 max-[900px]:pt-6">
        <CheckoutSummary cart={cart} shippingMethod={checkout.values.shippingMethod} changedKeys={checkout.changedKeys} />
      </aside>
    </main>
  );
}
