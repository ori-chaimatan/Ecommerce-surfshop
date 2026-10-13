'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { texts } from '../product-detail-texts';
import { PhotoLightbox } from '../shared/PhotoLightbox';
import { styles } from './standard-gallery.styles';
import type { IStandardGalleryProps } from './standard.types';

export const StandardGallery = ({ images, name }: IStandardGalleryProps): React.JSX.Element => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photoRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const openedFrom = useRef(0);
  const count = images.length;

  const openLightbox = (index: number) => {
    openedFrom.current = index;
    setLightboxIndex(index);
  };
  const closeLightbox = () => {
    setLightboxIndex(null);
    photoRefs.current[openedFrom.current]?.focus();
  };

  return (
    <div className={styles.gallery}>
      <div className={styles.grid}>
        {images.map((image, index) => (
          <button
            key={`${index}-${image.src}`}
            ref={(element) => {
              photoRefs.current[index] = element;
            }}
            type="button"
            aria-label={texts.openPhoto(index + 1, count)}
            onClick={() => openLightbox(index)}
            className={`${styles.frame.base} ${styles.frame.span[count === 1 ? 'single' : 'many']}`}
          >
            <Image
              src={image.src}
              alt={name}
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
              priority={index === 0}
              className={styles.photo}
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox images={images} name={name} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={closeLightbox} />
      )}
    </div>
  );
};
