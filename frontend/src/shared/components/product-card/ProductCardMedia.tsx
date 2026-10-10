'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Icon } from '@/shared/components/icons';
import type { ProductCard } from './product-card';
import { texts } from './product-card-texts';

const MAX_PHOTOS = 4;

// Dots are hover-revealed only where hover is real (mouse/trackpad); touch keeps them visible. Opacity, not display,
// so they stay focusable and nothing shifts; focus inside the card reveals them for keyboard users.
const DOTS_REVEAL =
  'transition-opacity duration-200 motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:opacity-0 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:opacity-100 group-focus-within/card:opacity-100';

interface ProductCardMediaProps {
  product: ProductCard;
  priority?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export function ProductCardMedia({ product, priority = false, isFavorite, onToggleFavorite }: ProductCardMediaProps) {
  const [active, setActive] = useState(0);
  const photos = product.images.slice(0, MAX_PHOTOS);
  const showFavorite = isFavorite !== undefined && onToggleFavorite !== undefined;

  return (
    <div className="relative aspect-[4/5] bg-background">
      {photos.map((photo, index) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={index === 0 ? product.name : ''}
          fill
          sizes="(max-width: 520px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={priority && index === 0}
          data-active={index === active ? 'true' : 'false'}
          className={`${product.imageFit === 'contain' ? 'object-contain' : 'object-cover'} transition-opacity duration-[250ms] motion-reduce:transition-none ${
            index === active ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}

      {showFavorite && (
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-label={isFavorite ? texts.removeFromWishlist : texts.addToWishlist}
          onClick={() => onToggleFavorite(product.slug)}
          className="group absolute right-2.5 top-2.5 z-[2] flex h-9 w-9 items-center justify-center rounded-full border border-border bg-white text-horizon shadow-[0_1px_4px_rgba(16,24,40,.10)] transition-colors duration-150 hover:border-horizon"
        >
          <Icon name="heart" className="h-[17px] w-[17px] fill-none stroke-current stroke-2 group-aria-pressed:fill-current" />
        </button>
      )}

      {photos.length > 1 && (
        <div
          role="group"
          aria-label={texts.photosLabel}
          className={`absolute bottom-3 left-1/2 z-[2] flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/85 px-2 py-1.5 shadow-[0_1px_4px_rgba(16,24,40,.12)] ${DOTS_REVEAL}`}
        >
          {photos.map((photo, index) => (
            <button
              key={photo.src}
              type="button"
              aria-label={texts.showPhoto(index + 1)}
              aria-current={index === active ? 'true' : 'false'}
              onClick={() => setActive(index)}
              className={`relative h-2 rounded-full transition-[width,background-color] duration-200 before:absolute before:-inset-x-1 before:-inset-y-2.5 before:content-[''] ${
                index === active ? 'w-[22px] bg-ink' : 'w-2 bg-ink/25'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
