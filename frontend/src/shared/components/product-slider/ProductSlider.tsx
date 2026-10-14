'use client';

import { Children, type ReactNode } from 'react';
import { Icon } from '@/shared/components/icons';
import { styles } from './product-slider.styles';
import { texts } from './product-slider-texts';
import { useProductSlider } from './use-product-slider';

interface ProductSliderProps {
  /** One card per child (e.g. `WishlistProductCard`), so the slider stays free of app-level state. */
  children: ReactNode;
}

/** Desktop shows 4 per view; more than that overflows into the slider. */
const DESKTOP_PER_VIEW = 4;

/** A row of product cards: snap scrolling, edge-aware arrows, one dot per snap position. */
export function ProductSlider({ children }: ProductSliderProps) {
  const slider = useProductSlider();
  const items = Children.toArray(children);
  const overflowsDesktop = items.length > DESKTOP_PER_VIEW;

  return (
    <>
      <div className={`${styles.slider.base} ${overflowsDesktop ? styles.slider.overflowing : ''}`}>
        {!slider.atStart && (
          <button type="button" aria-label={texts.previous} onClick={() => slider.page(-1)} className={`${styles.arrow.base} ${styles.arrow.prev}`}>
            <Icon name="arrow-left" className={styles.arrowIcon} />
          </button>
        )}
        <div ref={slider.trackRef} data-track onScroll={slider.onScroll} className={styles.track}>
          {items.map((item, index) => (
            <div key={index} className={styles.item}>
              {item}
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
