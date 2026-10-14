import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/strapi/product';
import { getFeaturedProducts } from '@/lib/strapi/products';
import { buildBreadcrumb } from './shared/breadcrumb';
import { ProductBreadcrumb } from './shared/ProductBreadcrumb';
import { ProductUnavailable } from './shared/ProductUnavailable';
import { RelatedProducts } from './shared/RelatedProducts';
import { StandardProductDetail } from './standard/StandardProductDetail';
import { toStandardDetail } from './standard/standard-detail';
import { SurfboardDetail } from './surfboard/SurfboardDetail';
import { toSurfboardDetail } from './surfboard/surfboard-detail';

interface ProductDetailPageProps {
  productSlug: string;
}

export async function ProductDetailPage({ productSlug }: ProductDetailPageProps) {
  const [result, featured] = await Promise.all([getProductBySlug(productSlug), getFeaturedProducts()]);
  if (result.kind === 'not-found') notFound();

  // Unavailable renders a 200 with a message; a product no layout can render is a 404 (AC3, AC4).
  const product = result.kind === 'ok' ? result.product : null;
  const surfboard = product?.SizeType === 'Surfboard' ? toSurfboardDetail(product) : null;
  const standard = product?.SizeType === 'Standard' ? toStandardDetail(product) : null;
  if (product && !surfboard && !standard) notFound();
  // "You might also like": the Featured products, minus this one (Ori's decision, 2026-10-14).
  const related = (featured ?? []).filter((card) => card.slug !== productSlug);

  return (
    <main>
      <ProductBreadcrumb items={buildBreadcrumb(surfboard ?? standard)} />
      {surfboard ? (
        <SurfboardDetail detail={surfboard} />
      ) : standard ? (
        <StandardProductDetail detail={standard} />
      ) : (
        <ProductUnavailable />
      )}
      {product && <RelatedProducts products={related} />}
    </main>
  );
}
