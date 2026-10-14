'use client';

import Image from 'next/image';
import { useEffect, useRef, type MouseEvent } from 'react';
import { Icon } from '@/shared/components/icons';
import { texts } from '../product-detail-texts';
import { styles } from './photo-lightbox.styles';
import type { IPhotoLightboxProps } from './photo-lightbox.types';

export const PhotoLightbox = ({ images, name, index, onIndexChange, onClose }: IPhotoLightboxProps): React.JSX.Element => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
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
    // aria-modal alone doesn't stop Tab: keep focus cycling through the dialog's own buttons.
    const trapFocus = (event: KeyboardEvent) => {
      const buttons = Array.from(dialogRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []);
      if (buttons.length === 0) return;
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      const active = document.activeElement;
      const inside = dialogRef.current?.contains(active) ?? false;
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') trapFocus(event);
      else if (event.key === 'Escape') onClose();
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
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={texts.photoViewer}
      onClick={onBackdropClick}
      className={styles.backdrop}
    >
      <div className={styles.stage}>
        <Image
          src={image.src}
          alt={name}
          fill
          sizes="(max-width: 900px) 88vw, 860px"
          className={styles.photo}
        />
        <button
          ref={closeRef}
          type="button"
          aria-label={texts.closePhotoViewer}
          onClick={onClose}
          className={styles.close}
        >
          <Icon name="close" className={styles.closeIcon} />
        </button>
        {hasMany && (
          <>
            <button
              type="button"
              aria-label={texts.previousPhoto}
              onClick={() => step(-1)}
              className={`${styles.arrow.base} ${styles.arrow.side.previous}`}
            >
              <Icon name="arrow-left" className={styles.arrowIcon} />
            </button>
            <button
              type="button"
              aria-label={texts.nextPhoto}
              onClick={() => step(1)}
              className={`${styles.arrow.base} ${styles.arrow.side.next}`}
            >
              <Icon name="arrow-right" className={styles.arrowIcon} />
            </button>
            <span className={styles.counter}>
              {texts.photoCount(index + 1, count)}
            </span>
          </>
        )}
      </div>
    </div>
  );
};
