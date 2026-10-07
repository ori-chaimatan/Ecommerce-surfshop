'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { texts } from '../product-detail-texts';
import { PhotoLightbox } from '../shared/PhotoLightbox';
import type { StandardDetail } from './standard-detail';

// Every photo sits in the same fixed 4:5 frame, never sized from the photo, so nothing shifts as images load.
// Desktop: a 2-up grid that scrolls past the sticky buy column. ≤900px: a full-width scroll-snap swipe.
const GRID =
  'grid grid-cols-2 gap-[3px] max-[900px]:flex max-[900px]:gap-0 max-[900px]:overflow-x-auto max-[900px]:snap-x max-[900px]:snap-mandatory max-[900px]:[scrollbar-width:none] max-[900px]:[&::-webkit-scrollbar]:hidden';
const FRAME =
  'relative aspect-[4/5] w-full cursor-zoom-in overflow-hidden bg-background max-[900px]:flex-[0_0_100%] max-[900px]:snap-center max-[900px]:snap-always';

interface StandardGalleryProps {
  images: StandardDetail['images'];
  name: string;
}

export function StandardGallery({ images, name }: StandardGalleryProps) {
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
    <div className="min-w-0">
      <div className={GRID}>
        {images.map((image, index) => (
          <button
            key={`${index}-${image.src}`}
            ref={(element) => {
              photoRefs.current[index] = element;
            }}
            type="button"
            aria-label={texts.openPhoto(index + 1, count)}
            onClick={() => openLightbox(index)}
            className={`${FRAME} ${count === 1 ? 'col-span-2' : ''}`}
          >
            <Image
              src={image.src}
              alt={name}
              fill
              sizes="(max-width: 900px) 100vw, 38vw"
              priority={index === 0}
              className="object-contain transition-opacity duration-200 hover:opacity-[.92]"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <PhotoLightbox images={images} name={name} index={lightboxIndex} onIndexChange={setLightboxIndex} onClose={closeLightbox} />
      )}
    </div>
  );
}
