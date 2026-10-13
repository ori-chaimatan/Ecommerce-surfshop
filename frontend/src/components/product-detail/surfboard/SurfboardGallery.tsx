'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { PhotoLightbox } from '../shared/PhotoLightbox';
import { styles } from './surfboard-gallery.styles';
import type { ISurfboardGalleryProps } from './surfboard.types';

export const SurfboardGallery = ({ images, name }: ISurfboardGalleryProps): React.JSX.Element => {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const hasMany = count > 1;
  const image = images[index];

  const step = (delta: number) => setIndex((current) => (current + delta + count) % count);
  const closeLightbox = () => {
    setLightboxOpen(false);
    mainRef.current?.focus();
  };

  return (
    <div className={styles.gallery}>
      {hasMany && (
        <button type="button" aria-label={texts.previousPhoto} onClick={() => step(-1)} className={styles.navButton}>
          <Icon name="arrow-left" className={styles.navIcon} />
        </button>
      )}

      <button
        ref={mainRef}
        type="button"
        aria-label={texts.openPhoto(index + 1, count)}
        onClick={() => setLightboxOpen(true)}
        className={styles.frame}
      >
        <Image
          key={image.src}
          src={image.src}
          alt={name}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority={index === 0}
          className={styles.photo}
        />
      </button>

      {hasMany && (
        <button type="button" aria-label={texts.nextPhoto} onClick={() => step(1)} className={styles.navButton}>
          <Icon name="arrow-right" className={styles.navIcon} />
        </button>
      )}

      {lightboxOpen && (
        <PhotoLightbox images={images} name={name} index={index} onIndexChange={setIndex} onClose={closeLightbox} />
      )}
    </div>
  );
};
