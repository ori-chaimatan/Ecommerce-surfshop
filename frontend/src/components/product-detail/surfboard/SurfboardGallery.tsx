'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { PhotoLightbox } from '../shared/PhotoLightbox';
import type { SurfboardDetail } from './surfboard-detail';

// A fixed frame: column width × 74vh (the tallest a board photo may be), never derived from the photo,
// so flipping photos moves nothing — the photo is centred inside with object-contain.
const FRAME = 'relative h-[74vh] w-full min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-[9px] bg-background';
const NAV_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-ink';
const NAV_ICON = 'h-4 w-4 fill-none stroke-ink stroke-2';

interface SurfboardGalleryProps {
  images: SurfboardDetail['images'];
  name: string;
}

export function SurfboardGallery({ images, name }: SurfboardGalleryProps) {
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
    <div className="sticky top-24 flex items-center gap-3.5 self-start max-[900px]:static max-[900px]:order-1 max-[900px]:gap-2">
      {hasMany && (
        <button type="button" aria-label={texts.previousPhoto} onClick={() => step(-1)} className={NAV_BUTTON}>
          <Icon name="arrow-left" className={NAV_ICON} />
        </button>
      )}

      <button
        ref={mainRef}
        type="button"
        aria-label={texts.openPhoto(index + 1, count)}
        onClick={() => setLightboxOpen(true)}
        className={FRAME}
      >
        <Image
          key={image.src}
          src={image.src}
          alt={name}
          fill
          sizes="(max-width: 900px) 100vw, 50vw"
          priority={index === 0}
          className="object-contain"
        />
      </button>

      {hasMany && (
        <button type="button" aria-label={texts.nextPhoto} onClick={() => step(1)} className={NAV_BUTTON}>
          <Icon name="arrow-right" className={NAV_ICON} />
        </button>
      )}

      {lightboxOpen && (
        <PhotoLightbox images={images} name={name} index={index} onIndexChange={setIndex} onClose={closeLightbox} />
      )}
    </div>
  );
}
