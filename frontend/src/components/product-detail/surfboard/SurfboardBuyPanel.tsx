'use client';

import { useState } from 'react';
import { WishlistButton } from '@/components/wishlist';
import { ButtonCTA } from '@/shared/components/button-cta';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { TrustList } from '../shared/TrustList';
import { useAddToCart } from '../shared/use-add-to-cart';
import { styles } from './surfboard-buy-panel.styles';
import type { ISurfboardBuyPanelProps } from './surfboard.types';

export const SurfboardBuyPanel = ({ documentId, slug, price, sizes, defaultSizeIndex }: ISurfboardBuyPanelProps): React.JSX.Element => {
  const [selected, setSelected] = useState(Math.max(0, defaultSizeIndex));
  const inStock = defaultSizeIndex >= 0;
  const { adding, message, addSize, clearMessage } = useAddToCart(documentId);

  return (
    <div className={styles.panel}>
      <div className={styles.card}>
        {sizes.length > 0 && (
          <div className={styles.field}>
            <label htmlFor="surfboard-dimensions" className={styles.label}>
              {texts.dimensions}
            </label>
            <div className={styles.selectWrap}>
              <select
                id="surfboard-dimensions"
                value={selected}
                disabled={!inStock}
                onChange={(event) => {
                  setSelected(Number(event.target.value));
                  clearMessage();
                }}
                className={styles.select}
              >
                {sizes.map((size, index) => (
                  <option key={size.label} value={index} disabled={size.soldOut}>
                    {size.soldOut ? texts.soldOutOption(size.label) : size.label}
                  </option>
                ))}
              </select>
              <Icon name="chevron-down" className={styles.chevron} />
            </div>
          </div>
        )}

        <div className={styles.buyRow}>
          <p className={styles.price}>{price}</p>
          <ButtonCTA
            text={!inStock ? texts.soldOut : adding ? texts.adding : texts.addToCart}
            disabled={!inStock || adding}
            onClick={() => void addSize(sizes[selected].key)}
          />
        </div>
        {message && (
          <p role="alert" className={styles.error}>
            {message}
          </p>
        )}

        {slug && (
          <div className={styles.actionsRow}>
            <WishlistButton slug={slug} variant="labelled" />
          </div>
        )}

        <TrustList />
      </div>
    </div>
  );
};
