'use client';

import { Icon } from '@/shared/components/icons';
import { styles } from './wishlist-button.styles';
import { useWishlist } from './wishlist-context';
import { texts } from './wishlist-texts';
import type { IWishlistButtonProps } from './wishlist.types';

/** The product page's wishlist control: Samurai `.btn-wish` (`icon`) or Tideline `.btn-outline-sm` (`labelled`). */
export const WishlistButton = ({ slug, variant }: IWishlistButtonProps): React.JSX.Element => {
  const { isSaved, toggle } = useWishlist();
  const saved = isSaved(slug);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? texts.removeFromWishlist : texts.addToWishlist}
      onClick={() => void toggle(slug)}
      className={styles.variant[variant]}
    >
      <Icon name="heart" className={`${styles.heart[variant]} ${saved ? styles.saved : ''}`} />
      {variant === 'labelled' && <span aria-hidden>{texts.wishlist}</span>}
    </button>
  );
};
