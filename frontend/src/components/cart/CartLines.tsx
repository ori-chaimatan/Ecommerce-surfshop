'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Icon } from '@/shared/components/icons';
import type { CartLineView } from './cart';
import { useCart } from './cart-context';
import { styles } from './cart-lines.styles';
import { texts } from './cart-texts';
import type { ICartLinesProps } from './cart.types';

const lineRef = ({ productDocumentId, sizeKey }: CartLineView) => ({ productDocumentId, sizeKey });

/** The cart's lines with quantity steppers and Remove, plus the cart-level notices above them. */
export const CartLines = ({ variant, onNavigate }: ICartLinesProps): React.JSX.Element | null => {
  const { cart, pendingKeys, mutationError, setQty, remove } = useCart();
  const page = variant === 'page';
  const stepClass = `${styles.step.base} ${styles.step.variant[variant]}`;

  if (cart.isEmpty && cart.removedCount === 0 && !mutationError) return null;

  return (
    <div className={styles.lines}>
      {cart.removedCount > 0 && <p className={styles.removedNote}>{texts.removed}</p>}
      {mutationError && (
        <p role="alert" className={styles.error}>
          {texts.updateFailed}
        </p>
      )}
      {!cart.isEmpty && (
        <ul className={styles.list}>
          {cart.lines.map((line) => (
            <li key={line.key} className={`${styles.row.base} ${styles.row.variant[variant]}`}>
              <div data-photo className={`${styles.photo.base} ${styles.photo.variant[variant]}`}>
                {line.image && (
                  <Image
                    src={line.image.src}
                    alt={line.image.alt}
                    fill
                    sizes={page ? '110px' : '76px'}
                    className={styles.image[line.image.fit]}
                  />
                )}
              </div>

              <div className={`${styles.details.base} ${styles.details.variant[variant]}`}>
                <div className={styles.nameRow}>
                  <Link href={line.href} onClick={onNavigate} className={`${styles.name.base} ${styles.name.variant[variant]}`}>
                    {line.name}
                  </Link>
                  {page && (
                    <span className={`${styles.pageTotal.base} ${styles.pageTotal.price[line.blocked ? 'blocked' : 'normal']}`}>
                      {line.lineTotal}
                    </span>
                  )}
                </div>
                <p className={`${styles.sizeLabel.base} ${styles.sizeLabel.variant[variant]}`}>{line.sizeLabel}</p>
                {line.adjusted && <p className={styles.note}>{texts.adjusted(line.maxQty)}</p>}
                {line.soldOut && <p className={styles.note}>{texts.soldOut}</p>}
                {line.unavailable && <p className={styles.note}>{texts.unavailable}</p>}

                <div className={`${styles.actions.base} ${styles.actions.variant[variant]}`}>
                  {!line.blocked && (
                    <div role="group" aria-label={texts.quantity(line.name)} className={styles.stepper}>
                      <button
                        type="button"
                        aria-label={texts.decrease}
                        disabled={pendingKeys.has(line.key) || line.quantity <= 1}
                        onClick={() => setQty(lineRef(line), line.quantity - 1)}
                        className={stepClass}
                      >
                        <Icon name="minus" className={styles.stepIcon} />
                      </button>
                      <span className={`${styles.quantity.base} ${styles.quantity.variant[variant]}`}>{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={texts.increase}
                        disabled={pendingKeys.has(line.key) || line.quantity >= line.maxQty}
                        onClick={() => setQty(lineRef(line), line.quantity + 1)}
                        className={stepClass}
                      >
                        <Icon name="plus" className={styles.stepIcon} />
                      </button>
                    </div>
                  )}
                  {page ? (
                    <button
                      type="button"
                      aria-label={texts.removeItem(line.name)}
                      disabled={pendingKeys.has(line.key)}
                      onClick={() => remove(lineRef(line))}
                      className={styles.pageRemove}
                    >
                      {texts.remove}
                    </button>
                  ) : (
                    <span className={`${styles.drawerTotal.base} ${styles.drawerTotal.price[line.blocked ? 'blocked' : 'normal']}`}>
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
                    className={styles.drawerRemove}
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
};
