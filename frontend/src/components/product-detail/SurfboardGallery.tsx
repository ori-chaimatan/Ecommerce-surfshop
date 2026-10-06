'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Icon } from '@/shared/components/icons';
import { texts } from './product-detail-texts';
import type { SurfboardDetail } from './surfboard-detail';

// A fixed frame: column width × 74vh (the tallest a board photo may be), never derived from the photo,
// so flipping photos moves nothing — the photo is centred inside with object-contain.
const FRAME = 'relative h-[74vh] w-full min-w-0 flex-1 cursor-zoom-in overflow-hidden rounded-[9px] bg-background';
const NAV_BUTTON =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-white transition-colors hover:border-ink';
const NAV_ICON = 'h-4 w-4 fill-none stroke-ink stroke-2';
const LIGHTBOX_ARROW =
  'absolute top-1/2 z-[3] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/[.12] text-white transition-colors hover:bg-white/[.22]';

interface SurfboardGalleryProps {
  images: SurfboardDetail['images'];
  name: string;
}

export function SurfboardGallery({ images, name }: SurfboardGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const mainRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const hasMany = count > 1;
  const image = images[index];

  const step = (delta: number) => setIndex((current) => (current + delta + count) % count);
  const closeLightbox = () => {
    setLightboxOpen(false);
    mainRef.current?.focus();
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightboxOpen(false);
        mainRef.current?.focus();
      } else if (event.key === 'ArrowLeft') {
        setIndex((current) => (current - 1 + count) % count);
      } else if (event.key === 'ArrowRight') {
        setIndex((current) => (current + 1) % count);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, count]);

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) closeLightbox();
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
        <div
          role="dialog"
          aria-modal="true"
          aria-label={texts.photoViewer}
          onClick={onBackdropClick}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[rgba(8,16,20,.94)]"
        >
          <div className="relative h-[min(78vh,860px)] w-[min(88vw,860px)]">
            <Image
              src={image.src}
              alt={name}
              fill
              sizes="(max-width: 900px) 88vw, 860px"
              className="rounded-[9px] bg-background object-contain"
            />
            <button
              ref={closeRef}
              type="button"
              aria-label={texts.closePhotoViewer}
              onClick={closeLightbox}
              className="absolute -top-[52px] right-0 flex h-9 w-9 items-center justify-center text-white"
            >
              <Icon name="close" className="h-[26px] w-[26px] fill-none stroke-current stroke-[1.8]" />
            </button>
            {hasMany && (
              <>
                <button
                  type="button"
                  aria-label={texts.previousPhoto}
                  onClick={() => step(-1)}
                  className={`${LIGHTBOX_ARROW} -left-16 max-[900px]:left-2`}
                >
                  <Icon name="arrow-left" className="h-5 w-5 fill-none stroke-current stroke-2" />
                </button>
                <button
                  type="button"
                  aria-label={texts.nextPhoto}
                  onClick={() => step(1)}
                  className={`${LIGHTBOX_ARROW} -right-16 max-[900px]:right-2`}
                >
                  <Icon name="arrow-right" className="h-5 w-5 fill-none stroke-current stroke-2" />
                </button>
                <span className="absolute -bottom-[34px] left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.04em] text-white">
                  {texts.photoCount(index + 1, count)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
