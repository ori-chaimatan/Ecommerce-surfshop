import { WishlistProductCard } from '@/components/wishlist';
import { getHomepageFeaturedText } from '@/lib/strapi/homepage';
import { getFeaturedProducts } from '@/lib/strapi/products';
import { ProductSlider } from '@/shared/components/product-slider';
import { styles } from './featured-gear.styles';
import { texts } from './featured-gear-texts';

/**
 * Home "Featured gear" (design index.html `section.featured`): the products marked Featured in
 * Strapi, with the eyebrow and title from the Homepage. Nothing renders without products.
 */
export const FeaturedGear = async (): Promise<React.JSX.Element | null> => {
  const [products, copy] = await Promise.all([getFeaturedProducts(), getHomepageFeaturedText()]);
  if (!products?.length) return null;

  const eyebrow = copy?.eyebrow || texts.eyebrow;
  const title = copy?.title || texts.title;

  return (
    <section aria-labelledby="featured-gear-title" className={styles.section}>
      <div className={styles.container}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>{eyebrow}</span>
          <h2 id="featured-gear-title" className={styles.title}>
            {title}
          </h2>
        </div>
        <ProductSlider>
          {products.map((product) => (
            <WishlistProductCard key={product.slug} product={product} />
          ))}
        </ProductSlider>
      </div>
    </section>
  );
};
