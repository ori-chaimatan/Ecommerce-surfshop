'use client';

import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';

const LIGHTBOX_ARROW =
  'absolute top-1/2 z-[3] flex h-[46px] w-[46px] -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-white/[.12] text-white transition-colors hover:bg-white/[.22]';

interface PhotoLightboxProps {
  images: { src: string }[];
  name: string;
  index: number;
  onIndexChange: (index: number) => void;
  /** The parent unmounts the lightbox and puts focus back where it came from. */
  onClose: () => void;
}

export function PhotoLightbox({ images, name, index, onIndexChange, onClose }: PhotoLightboxProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;
  const hasMany = count > 1;
  const image = images[index];

  const step = (delta: number) => onIndexChange((index + delta + count) % count);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') onIndexChange((index - 1 + count) % count);
      else if (event.key === 'ArrowRight') onIndexChange((index + 1) % count);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [index, count, onIndexChange, onClose]);

  const onBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onClose();
  };

  return (
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
          onClick={onClose}
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
  );
}
