import Link from 'next/link';
import { formatPrice } from './product-card';
import type { IProductCardProps } from './product-card.types';
import { styles } from './product-card.styles';
import { ProductCardMedia } from './ProductCardMedia';
import { texts } from './product-card-texts';

export const ProductCard = ({ product, priority, isFavorite, onToggleFavorite }: IProductCardProps): React.JSX.Element => {
  return (
    <article className={styles.card}>
      <Link href={product.href} className={styles.link}>
        <span className="sr-only">{texts.viewProduct(product.name)}</span>
      </Link>

      <ProductCardMedia
        product={product}
        priority={priority}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.priceRow}>
          <span className={styles.price}>{formatPrice(product.price)}</span>
        </div>
      </div>
    </article>
  );
};
