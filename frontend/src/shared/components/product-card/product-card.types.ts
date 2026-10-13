import type { ProductCard } from './product-card';

export interface IProductCardProps {
  product: ProductCard;
  priority?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (slug: string) => void;
}

export type IProductCardMediaProps = IProductCardProps;
