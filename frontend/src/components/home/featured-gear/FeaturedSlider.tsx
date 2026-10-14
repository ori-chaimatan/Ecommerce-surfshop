'use client';

import { WishlistProductCard } from '@/components/wishlist';
import { Icon } from '@/shared/components/icons';
import type { ProductCard } from '@/shared/components/product-card/product-card';
import { styles } from './featured-gear.styles';
import { texts } from './featured-gear-texts';
import { useFeaturedSlider } from './use-featured-slider';

interface FeaturedSliderProps {
  products: ProductCard[];
}

/** Desktop shows 4 per view; more than that overflows into the slider. */
const DESKTOP_PER_VIEW = 4;

/** The Featured gear track: snap scrolling, edge-aware arrows, one dot per snap position. */
export function FeaturedSlider({ products }: FeaturedSliderProps) {
  const slider = useFeaturedSlider();
  const overflowsDesktop = products.length > DESKTOP_PER_VIEW;

  return (
    <>
      <div className={`${styles.slider.base} ${overflowsDesktop ? styles.slider.overflowing : ''}`}>
        {!slider.atStart && (
          <button type="button" aria-label={texts.previous} onClick={() => slider.page(-1)} className={`${styles.arrow.base} ${styles.arrow.prev}`}>
            <Icon name="arrow-left" className={styles.arrowIcon} />
          </button>
        )}
        <div ref={slider.trackRef} data-track onScroll={slider.onScroll} className={styles.track}>
          {products.map((product) => (
            <div key={product.slug} className={styles.item}>
              <WishlistProductCard product={product} />
            </div>
          ))}
        </div>
        {!slider.atEnd && (
          <button type="button" aria-label={texts.next} onClick={() => slider.page(1)} className={`${styles.arrow.base} ${styles.arrow.next}`}>
            <Icon name="arrow-right" className={styles.arrowIcon} />
          </button>
        )}
      </div>
      {slider.positions > 1 && (
        <div role="group" aria-label={texts.dotsLabel} className={styles.dots}>
          {Array.from({ length: slider.positions }, (_, index) => (
            <button
              key={index}
              type="button"
              aria-label={texts.goTo(index + 1)}
              aria-current={index === slider.current ? 'true' : 'false'}
              onClick={() => slider.goTo(index)}
              className={`${styles.dot.base} ${index === slider.current ? styles.dot.current : styles.dot.idle}`}
            />
          ))}
        </div>
      )}
    </>
  );
}
