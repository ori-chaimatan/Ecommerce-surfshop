import { notFound } from 'next/navigation';
import { getProductBySlug } from '@/lib/strapi/product';
import { buildBreadcrumb } from './shared/breadcrumb';
import { ProductBreadcrumb } from './shared/ProductBreadcrumb';
import { ProductUnavailable } from './shared/ProductUnavailable';
import { StandardProductDetail } from './standard/StandardProductDetail';
import { toStandardDetail } from './standard/standard-detail';
import { SurfboardDetail } from './surfboard/SurfboardDetail';
import { toSurfboardDetail } from './surfboard/surfboard-detail';

interface ProductDetailPageProps {
  productSlug: string;
}

export async function ProductDetailPage({ productSlug }: ProductDetailPageProps) {
  const result = await getProductBySlug(productSlug);
  if (result.kind === 'not-found') notFound();

  // Unavailable renders a 200 with a message; a product no layout can render is a 404 (AC3, AC4).
  const product = result.kind === 'ok' ? result.product : null;
  const surfboard = product?.SizeType === 'Surfboard' ? toSurfboardDetail(product) : null;
  const standard = product?.SizeType === 'Standard' ? toStandardDetail(product) : null;
  if (product && !surfboard && !standard) notFound();

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
    </main>
  );
}
