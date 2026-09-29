import Link from 'next/link';
import { formatPrice, type ProductCard as ProductCardData } from './product-card';
import { ProductCardMedia } from './ProductCardMedia';

interface ProductCardProps {
  product: ProductCardData;
  priority?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export function ProductCard({ product, priority, isFavorite, onToggleFavorite }: ProductCardProps) {
  return (
    <article className="relative overflow-hidden rounded-[9px] border border-border bg-white">
      <Link href={product.href} className="absolute inset-0 z-[1]">
        <span className="sr-only">View {product.name}</span>
      </Link>

      <ProductCardMedia
        product={product}
        priority={priority}
        isFavorite={isFavorite}
        onToggleFavorite={onToggleFavorite}
      />

      <div className="p-4">
        <h3 className="mb-1.5 text-base font-bold text-ink">{product.name}</h3>
        <div className="flex items-center justify-between gap-2.5">
          <span className="text-base text-ink">{formatPrice(product.price)}</span>
        </div>
      </div>
    </article>
  );
}
