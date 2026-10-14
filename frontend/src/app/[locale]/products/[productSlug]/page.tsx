import { ProductDetailPage } from '@/components/product-detail';

export default function ProductPage({ params: { productSlug } }: { params: { productSlug: string } }) {
  return <ProductDetailPage productSlug={productSlug} />;
}
