import Image from 'next/image';
import type { CartView } from '@/components/cart/cart';
import type { ShippingMethod } from '@/lib/shipping';
import { checkoutTotals, lineMeta, lineNote } from './checkout';
import { texts } from './checkout-texts';

interface CheckoutSummaryProps {
  cart: CartView;
  shippingMethod: ShippingMethod;
  /** Lines the server refused because they changed since review. */
  changedKeys: ReadonlySet<string>;
}

const ROW = 'flex justify-between text-sm text-muted';

/** The checkout's "Order Summary" column (design `.co-summary`): the review of what will be charged. */
export function CheckoutSummary({ cart, shippingMethod, changedKeys }: CheckoutSummaryProps) {
  const totals = checkoutTotals(cart, shippingMethod);

  return (
    <div className="sticky top-24 flex w-full max-w-[460px] flex-col gap-4 max-[900px]:static max-[900px]:max-w-none">
      <h2 className="text-[17px] font-bold text-ink">{texts.orderSummary}</h2>
      <ul className="flex flex-col gap-[22px]">
        {cart.lines.map((line) => {
          const note = lineNote(line, changedKeys);
          return (
            <li key={line.key} className="flex gap-4">
              <div className="relative h-[92px] w-[76px] shrink-0 overflow-hidden rounded-[9px] border-[1.5px] border-border bg-white shadow-[0_1px_3px_rgba(18,33,42,.06)]">
                {line.image && (
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    sizes="76px"
                    className={line.image.fit === 'contain' ? 'object-contain' : 'object-cover'}
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col justify-center gap-0.5">
                <p className="text-sm font-bold text-ink">{line.name}</p>
                <p className="text-[12.5px] text-muted">{lineMeta(line.sizeLabel, line.quantity)}</p>
                {note && <p className="font-mono text-[11.5px] text-danger">{note}</p>}
              </div>
              <span
                className={`self-center whitespace-nowrap font-mono text-[13.5px] font-semibold ${
                  line.blocked ? 'text-muted line-through' : 'text-ink'
                }`}
              >
                {line.lineTotal}
              </span>
            </li>
          );
        })}
      </ul>
      <div className={ROW}>
        <span>{texts.subtotal}</span>
        <span>{totals.subtotal}</span>
      </div>
      <div className={ROW}>
        <span>{texts.shipping}</span>
        <span>{totals.shipping}</span>
      </div>
      <div className="mt-0.5 flex justify-between border-t border-border pt-3.5 text-base font-bold text-ink">
        <span>{texts.total}</span>
        <span>{totals.total}</span>
      </div>
      <p className="text-xs text-muted">{texts.taxNote}</p>
    </div>
  );
}
