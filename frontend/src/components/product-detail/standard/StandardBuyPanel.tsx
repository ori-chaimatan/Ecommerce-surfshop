'use client';

import { useId, useState } from 'react';
import { ButtonCTA } from '@/shared/components/button-cta';
import { texts } from '../product-detail-texts';
import { styles } from './standard-buy-panel.styles';
import type { IStandardBuyPanelProps } from './standard.types';

export const StandardBuyPanel = ({ sizes, defaultSizeIndex }: IStandardBuyPanelProps): React.JSX.Element => {
  const [selected, setSelected] = useState(defaultSizeIndex);
  const labelId = useId();
  const inStock = defaultSizeIndex >= 0;
  const current = selected >= 0 ? sizes[selected] : undefined;

  return (
    <div>
      {sizes.length > 0 && (
        <div role="group" aria-labelledby={labelId} className={styles.sizeGroup}>
          <span id={labelId} className={styles.sizeLabel}>
            {current ? texts.standard.selectedSize(current.label) : texts.standard.size}
          </span>
          <div className={styles.sizeGrid}>
            {sizes.map((size, index) => (
              <button
                key={size.label}
                type="button"
                disabled={size.soldOut}
                aria-pressed={index === selected}
                aria-label={
                  size.soldOut
                    ? texts.standard.soldOutSize(size.label)
                    : size.lowStock
                      ? texts.standard.lowStockSize(size.label)
                      : undefined
                }
                onClick={() => setSelected(index)}
                className={`${styles.size.base} ${styles.size.state[size.soldOut ? 'soldOut' : index === selected ? 'selected' : 'idle']}`}
              >
                {size.label}
                {size.lowStock && (
                  <span aria-hidden className={styles.lowStockBadge}>
                    !
                  </span>
                )}
              </button>
            ))}
          </div>
          {current?.lowStock && (
            <p className={styles.lowStockNote}>
              {texts.standard.lowStock}
            </p>
          )}
        </div>
      )}

      <div className={styles.buy}>
        <ButtonCTA text={inStock ? texts.addToCart : texts.soldOut} disabled={!inStock} />
      </div>
    </div>
  );
};
