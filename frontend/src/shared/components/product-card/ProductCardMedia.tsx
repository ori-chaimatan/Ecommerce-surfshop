'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/shared/components/icons';
import type { IProductCardMediaProps } from './product-card.types';
import { styles } from './product-card-media.styles';
import { texts } from './product-card-texts';

const MAX_PHOTOS = 4;

export const ProductCardMedia = ({
  product,
  priority = false,
  isFavorite,
  onToggleFavorite,
}: IProductCardMediaProps): React.JSX.Element => {
  const [active, setActive] = useState(0);
  const photos = product.images.slice(0, MAX_PHOTOS);
  // The same card can be re-rendered with fewer photos (revalidation, index-keyed lists).
  const current = active < photos.length ? active : 0;
  const showFavorite = isFavorite !== undefined && onToggleFavorite !== undefined;

  return (
    <div className={styles.frame}>
      {photos.map((photo, index) => (
        <Image
          key={index}
          src={photo.src}
          alt={index === 0 ? product.name : ''}
          fill
          sizes="(max-width: 520px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority && index === 0}
          data-active={index === current ? 'true' : 'false'}
          className={`${styles.photo.fit[product.imageFit]} ${styles.photo.base} ${styles.photo.state[index === current ? 'active' : 'idle']}`}
        />
      ))}

      {showFavorite && (
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? texts.removeFromWishlist : texts.addToWishlist}
          onClick={() => onToggleFavorite(product.slug)}
          className={styles.favorite}
        >
          <Icon name="heart" className={styles.heart} />
        </button>
      )}

      {photos.length > 1 && (
        <div role="group" aria-label={texts.photosLabel} className={styles.dots}>
          {photos.map((_photo, index) => (
            <button
              key={index}
              type="button"
              aria-label={texts.showPhoto(index + 1)}
              aria-current={index === current ? 'true' : 'false'}
              onClick={() => setActive(index)}
              className={`${styles.dot.base} ${styles.dot.state[index === current ? 'active' : 'idle']}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
