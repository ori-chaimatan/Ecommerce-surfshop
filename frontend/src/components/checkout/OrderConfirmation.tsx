import Image from 'next/image';
import Link from 'next/link';
import { CONTAINER } from '@/components/product-detail/shared/layout';
import { PRODUCTS_HREF } from '@/lib/routes';
import { Icon } from '@/shared/components/icons';
import type { OrderView } from './checkout';
import { texts } from './checkout-texts';

const ROW = 'flex justify-between text-sm text-muted';
const DETAIL_HEADING = 'mb-1 text-[12.5px] font-semibold text-muted';

/** The order confirmation (design `checkout.html` `.co-confirm`), from the order's stored snapshot. */
export function OrderConfirmation({ order }: { order: OrderView }) {
  return (
    <main className={`${CONTAINER} bg-white`}>
      <div className="mx-auto max-w-[640px] pb-6 pt-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-horizon text-horizon-ink">
          <Icon name="check" width={30} height={30} fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </div>
        <h1 className="mb-2.5 font-display text-[clamp(26px,3.6vw,36px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink">
          {texts.thankYou}
        </h1>
        <p className="mb-1 text-[15px] text-muted">{texts.placed}</p>
        <p className="mb-1 text-[15px] text-muted">
          {texts.confirmationSentPrefix} <strong className="text-ink">{order.email}</strong>.
        </p>
        <p className="mb-8 mt-[18px] inline-block rounded-[9px] bg-surface px-[22px] py-3 font-mono text-[22px] font-bold tracking-[0.02em] text-ink">
          {`${texts.orderNumberPrefix}${order.orderNumber}`}
        </p>

        <section className="mb-7 rounded-[9px] border border-border p-6 text-left">
          <h2 className="mb-4 text-sm font-bold text-ink">{texts.orderSummary}</h2>
          <ul className="mb-4 flex flex-col gap-[22px]">
            {order.lines.map((line) => (
              <li key={line.key} className="flex gap-4">
                <div className="relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-[9px] border-[1.5px] border-border bg-white">
                  {line.image && <Image src={line.image.src} alt={line.image.alt} fill sizes="76px" className="object-cover" />}
                </div>
                <div className="flex flex-1 flex-col justify-center gap-0.5">
                  <p className="text-sm font-bold text-ink">{line.name}</p>
                  <p className="text-[12.5px] text-muted">{line.meta}</p>
                </div>
                <span className="self-center whitespace-nowrap font-mono text-[13.5px] font-semibold text-ink">{line.lineTotal}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col gap-2.5">
            <div className={ROW}>
              <span>{texts.subtotal}</span>
              <span>{order.subtotal}</span>
            </div>
            <div className={ROW}>
              <span>{order.shippingRow}</span>
              <span>{order.shipping}</span>
            </div>
            <div className="mt-1.5 flex justify-between border-t border-border pt-3.5 text-base font-bold text-ink">
              <span>{texts.totalPaid}</span>
              <span>{order.total}</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-5 border-t border-border pt-5 text-sm text-ink max-[600px]:grid-cols-1">
            <div>
              <h3 className={DETAIL_HEADING}>{texts.shipTo}</h3>
              <p>
                {order.shipTo.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </p>
            </div>
            <div>
              <h3 className={DETAIL_HEADING}>{texts.shippingMethodHeading}</h3>
              <p>{order.shippingMethod.label}</p>
              <p className="text-muted">{order.shippingMethod.eta}</p>
            </div>
            <div>
              <h3 className={DETAIL_HEADING}>{texts.paymentHeading}</h3>
              <p>{order.payment}</p>
            </div>
          </div>
        </section>

        <Link
          href={PRODUCTS_HREF}
          className="inline-block rounded-[9px] border-2 border-ink px-6 py-[13px] text-sm font-bold uppercase tracking-[0.03em] text-ink hover:bg-ink hover:text-white"
        >
          {texts.continueShopping}
        </Link>
      </div>
    </main>
  );
}
