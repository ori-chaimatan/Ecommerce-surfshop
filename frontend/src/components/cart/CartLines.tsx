'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/shared/components/icons';
import type { CartLineView } from './cart';
import { useCart } from './cart-context';
import { texts } from './cart-texts';

interface CartLinesProps {
  /** `drawer`: compact rows (76×95 photo). `page`: the cart page rows (110×138 photo). */
  variant: 'drawer' | 'page';
}

const NOTE = 'font-mono text-[11.5px] font-semibold uppercase tracking-[0.04em] text-danger';
const lineRef = ({ productDocumentId, sizeKey }: CartLineView) => ({ productDocumentId, sizeKey });

const STEP_ICON = 'h-3.5 w-3.5 fill-none stroke-current stroke-2';

/** The cart's lines with quantity steppers and Remove, plus the cart-level notices above them. */
export function CartLines({ variant }: CartLinesProps) {
  const { cart, pendingKeys, mutationError, setQty, remove } = useCart();
  const page = variant === 'page';
  const step = page ? 'h-8 w-8' : 'h-[26px] w-[26px]';

  if (cart.isEmpty && cart.removedCount === 0 && !mutationError) return null;

  return (
    <div className="flex flex-col">
      {cart.removedCount > 0 && <p className="py-3 text-[13px] text-muted">{texts.removed}</p>}
      {mutationError && (
        <p role="alert" className="py-3 text-[13px] text-danger">
          {texts.updateFailed}
        </p>
      )}
      {!cart.isEmpty && (
        <ul className="flex flex-col">
          {cart.lines.map((line) => (
            <li
              key={line.key}
              className={`flex border-b border-border ${page ? 'gap-5 py-6' : 'gap-3.5 py-4'}`}
            >
              <div
                data-photo
                className={`relative shrink-0 overflow-hidden rounded-[9px] bg-surface ${
                  page ? 'h-[138px] w-[110px]' : 'h-[95px] w-[76px]'
                }`}
              >
                {line.image && (
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    sizes={page ? '110px' : '76px'}
                    className={line.image.fit === 'contain' ? 'object-contain' : 'object-cover'}
                  />
                )}
              </div>

              <div className={`flex flex-1 flex-col ${page ? 'gap-1.5' : 'gap-1'}`}>
                <div className="flex justify-between gap-3">
                  <Link href={line.href} className={`font-bold text-ink hover:text-horizon ${page ? 'text-base' : 'text-sm'}`}>
                    {line.name}
                  </Link>
                  {page && (
                    <span
                      className={`whitespace-nowrap font-mono text-[15px] font-semibold ${
                        line.blocked ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {line.lineTotal}
                    </span>
                  )}
                </div>
                <p className={`text-muted ${page ? 'text-[13px]' : 'text-[12.5px]'}`}>{line.sizeLabel}</p>
                {line.adjusted && <p className={NOTE}>{texts.adjusted(line.maxQty)}</p>}
                {line.soldOut && <p className={NOTE}>{texts.soldOut}</p>}
                {line.unavailable && <p className={NOTE}>{texts.unavailable}</p>}

                <div className={`flex items-center justify-between gap-3 ${page ? 'mt-auto pt-2' : 'mt-2'}`}>
                  {!line.blocked && (
                    <div
                      role="group"
                      aria-label={texts.quantity(line.name)}
                      className="flex items-center rounded-[9px] border border-border"
                    >
                      <button
                        type="button"
                        aria-label={texts.decrease}
                        disabled={pendingKeys.has(line.key) || line.quantity <= 1}
                        onClick={() => setQty(lineRef(line), line.quantity - 1)}
                        className={`flex items-center justify-center text-ink hover:text-horizon disabled:cursor-not-allowed disabled:opacity-40 ${step}`}
                      >
                        <Icon name="minus" className={STEP_ICON} />
                      </button>
                      <span className={`text-center font-mono ${page ? 'min-w-[26px] text-sm' : 'min-w-5 text-[13px]'}`}>
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={texts.increase}
                        disabled={pendingKeys.has(line.key) || line.quantity >= line.maxQty}
                        onClick={() => setQty(lineRef(line), line.quantity + 1)}
                        className={`flex items-center justify-center text-ink hover:text-horizon disabled:cursor-not-allowed disabled:opacity-40 ${step}`}
                      >
                        <Icon name="plus" className={STEP_ICON} />
                      </button>
                    </div>
                  )}
                  {page ? (
                    <button
                      type="button"
                      aria-label={texts.removeItem(line.name)}
                      disabled={pendingKeys.has(line.key)}
                      onClick={() => remove(lineRef(line))}
                      className="ml-auto text-[12.5px] text-muted underline underline-offset-[3px] hover:text-ink disabled:opacity-40"
                    >
                      {texts.remove}
                    </button>
                  ) : (
                    <span
                      className={`ml-auto font-mono text-[13.5px] font-semibold ${
                        line.blocked ? 'text-muted line-through' : 'text-ink'
                      }`}
                    >
                      {line.lineTotal}
                    </span>
                  )}
                </div>
                {!page && (
                  <button
                    type="button"
                    aria-label={texts.removeItem(line.name)}
                    disabled={pendingKeys.has(line.key)}
                    onClick={() => remove(lineRef(line))}
                    className="mt-1.5 self-start text-xs text-muted underline hover:text-ink disabled:opacity-40"
                  >
                    {texts.remove}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
