import { WishlistProductCard } from '@/components/wishlist';
import type { ProductCard } from '@/shared/components/product-card/product-card';
import { ProductSlider } from '@/shared/components/product-slider';
import { texts } from '../product-detail-texts';
import { CONTAINER } from './layout';

interface RelatedProductsProps {
  /** The Featured products, without the one on this page. */
  products: ProductCard[];
}

/** The product pages' "You might also like" rail (design `.related`), filled with Featured products. */
export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section aria-labelledby="related-products-title" className={`${CONTAINER} mt-16 pb-20`}>
      <h2
        id="related-products-title"
        className="mb-6 mt-0 font-display text-[clamp(22px,3vw,30px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink"
      >
        {texts.relatedTitle}
      </h2>
      <ProductSlider>
        {products.map((product) => (
          <WishlistProductCard key={product.slug} product={product} />
        ))}
      </ProductSlider>
    </section>
  );
}
