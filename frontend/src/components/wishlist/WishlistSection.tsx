'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { categoryHref } from '@/lib/routes';
import { Icon } from '@/shared/components/icons';
import { ProductCard } from '@/shared/components/product-card';
import { useWishlistSlider } from './use-wishlist-slider';
import { useWishlist } from './wishlist-context';
import { styles } from './wishlist-section.styles';
import { texts } from './wishlist-texts';
import type { IWishlistSectionProps } from './wishlist.types';

/** Design: the card fades for 250ms; the toast stays 2.2s. */
const FADE_MS = 250;
const TOAST_MS = 2200;

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

/**
 * My Account → Wishlist (design profile.html `#panelWishlist`): the saved products as the
 * shared cards in a whole-card slider. Removing fades the card, then drops it with a toast;
 * if the removal fails the card comes back quietly.
 */
export const WishlistSection = ({ id, items }: IWishlistSectionProps): React.JSX.Element => {
  const { toggle, seed } = useWishlist();
  const [list, setList] = useState(items);
  const [removing, setRemoving] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState({ text: '', visible: false });
  const toastTimer = useRef<number>();
  const slider = useWishlistSlider(list.length);

  useEffect(() => {
    seed(items.map((item) => item.slug));
  }, [seed, items]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const setRemovingSlug = (slug: string, on: boolean) =>
    setRemoving((previous) => {
      const next = new Set(previous);
      if (on) next.add(slug);
      else next.delete(slug);
      return next;
    });

  async function remove(slug: string) {
    if (removing.has(slug)) return;
    setRemovingSlug(slug, true);
    const [removed] = await Promise.all([toggle(slug), wait(FADE_MS)]);
    setRemovingSlug(slug, false);
    if (!removed) return;

    setList((current) => current.filter((item) => item.slug !== slug));
    setToast({ text: texts.removed, visible: true });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast((current) => ({ ...current, visible: false })), TOAST_MS);
  }

  return (
    <section id={id} aria-labelledby={`${id}-title`} className={styles.section}>
      <div className={styles.head}>
        <h2 id={`${id}-title`} className={styles.title}>
          {texts.wishlist}
        </h2>
        <span className={styles.count}>{texts.savedCount(list.length)}</span>
      </div>

      {list.length > 0 ? (
        <div ref={slider.wrapRef} className={styles.wrap}>
          <button
            type="button"
            aria-label={texts.scrollLeft}
            onClick={() => slider.page(-1)}
            className={`${styles.arrow.base} ${slider.edges.atStart ? styles.arrow.hidden : ''}`}
          >
            <Icon name="arrow-left" className={styles.arrowIcon} />
          </button>
          <div
            ref={slider.gridRef}
            onScroll={slider.onScroll}
            className={styles.grid}
            style={slider.fit.gridWidth === null ? undefined : { flex: `0 0 ${slider.fit.gridWidth}px` }}
          >
            {list.map((item) => (
              <div
                key={item.slug}
                className={`${styles.item.base} ${removing.has(item.slug) ? styles.item.removing : ''}`}
                style={{ flexBasis: slider.fit.cardWidth, width: slider.fit.cardWidth }}
              >
                <ProductCard product={item} isFavorite onToggleFavorite={(slug) => void remove(slug)} />
              </div>
            ))}
          </div>
          <button
            type="button"
            aria-label={texts.scrollRight}
            onClick={() => slider.page(1)}
            className={`${styles.arrow.base} ${slider.edges.atEnd ? styles.arrow.hidden : ''}`}
          >
            <Icon name="arrow-right" className={styles.arrowIcon} />
          </button>
        </div>
      ) : (
        <p className={styles.empty}>
          {texts.emptyStart}
          <Link href={categoryHref('surfboards')} className={styles.emptyLink}>
            {texts.surfboards}
          </Link>
          {texts.or}
          <Link href={categoryHref('clothing')} className={styles.emptyLink}>
            {texts.apparel}
          </Link>
          {texts.emptyEnd}
        </p>
      )}

      <p role="status" aria-live="polite" className={`${styles.toast.base} ${toast.visible ? styles.toast.visible : styles.toast.hidden}`}>
        {toast.text}
      </p>
    </section>
  );
};
