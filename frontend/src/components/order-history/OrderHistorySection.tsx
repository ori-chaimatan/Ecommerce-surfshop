'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { StrapiOrder } from '@/lib/strapi/orders';
import { Icon } from '@/shared/components/icons';
import { toOrderHistoryItem } from './order-history';
import { styles } from './order-history.styles';
import { texts } from './order-history-texts';

interface OrderHistorySectionProps {
  /** The section id (the `#orders` scroll target). */
  id: string;
  /** The shopper's orders, newest first, fetched with the page. */
  orders: StrapiOrder[];
}

/**
 * My Account → Order History (design profile.html `#panelOrders`): one expandable card per
 * order, from its snapshot. Open state lives here, so several orders can be open at once.
 */
export function OrderHistorySection({ id, orders }: OrderHistorySectionProps) {
  const items = useMemo(() => orders.map(toOrderHistoryItem), [orders]);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const toggle = (orderNumber: string) =>
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(orderNumber)) next.delete(orderNumber);
      else next.add(orderNumber);
      return next;
    });

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.section}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {texts.orderHistory}
        </h2>
      </div>

      {items.length === 0 ? (
        <p className={styles.empty}>{texts.empty}</p>
      ) : (
        <>
          <div className={styles.list}>
            {items.map((item) => {
              const isOpen = open.has(item.orderNumber);
              const detailId = `${id}-${item.orderNumber}`;
              return (
                <div key={item.orderNumber} className={styles.card}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={detailId}
                    onClick={() => toggle(item.orderNumber)}
                    className={styles.summary}
                  >
                    <span className={styles.preview} aria-hidden>
                      {item.preview?.kind === 'image' && (
                        <Image src={item.preview.src} alt="" fill sizes="52px" className="object-cover" />
                      )}
                    </span>
                    <span className={styles.main}>
                      <span className={`${styles.number} block`}>{item.orderNumber}</span>
                      <span className={`${styles.date} block`}>{item.placedLabel}</span>
                    </span>
                    <span className={styles.count}>{item.itemCount}</span>
                    <span className={styles.status.base}>
                      <span aria-hidden className={`${styles.status.dot} ${styles.status[item.status.key]}`} />
                      {item.status.label}
                    </span>
                    <span className={styles.right}>
                      <span className={styles.total}>{item.total}</span>
                      <Icon name="chevron-down" className={`${styles.chevron.base} ${isOpen ? styles.chevron.open : ''}`} />
                    </span>
                  </button>

                  <div
                    id={detailId}
                    className={`${styles.detail.base} ${isOpen ? styles.detail.open : styles.detail.closed}`}
                    style={{ visibility: isOpen ? 'visible' : 'hidden' }}
                  >
                    <div className={styles.detailClip}>
                      <div className={styles.detailInner}>
                        <ul className={styles.items}>
                          {item.lines.map((line) => (
                            <li key={line.key} className={styles.item}>
                              <span className={styles.thumb}>
                                {line.thumb.kind === 'image' ? (
                                  <Image src={line.thumb.src} alt={line.thumb.alt} fill sizes="44px" className="object-cover" />
                                ) : (
                                  line.thumb.text
                                )}
                              </span>
                              <span>
                                <span className={`${styles.name} block`}>{line.name}</span>
                                <span className={`${styles.spec} block`}>{line.spec}</span>
                              </span>
                              <span className={styles.price}>{line.lineTotal}</span>
                            </li>
                          ))}
                        </ul>
                        <div className={styles.totals}>
                          <div className={styles.totalsRow}>
                            <span>{texts.subtotal}</span>
                            <span className={styles.totalsValue}>{item.subtotal}</span>
                          </div>
                          <div className={styles.totalsRow}>
                            <span>{texts.shipping}</span>
                            <span className={styles.totalsValue}>{item.shipping}</span>
                          </div>
                          <div className={styles.totalsGrand}>
                            <span>{texts.total}</span>
                            <span className={styles.totalsValue}>{item.total}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <p className={styles.note}>{texts.note}</p>
        </>
      )}
    </section>
  );
}
