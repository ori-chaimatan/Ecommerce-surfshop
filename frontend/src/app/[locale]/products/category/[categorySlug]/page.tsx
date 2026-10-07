import { CatalogPage } from '@/components/catalog';
import type { CatalogSearchParams } from '@/components/catalog/catalog';

export default function CategoryPage({
  params: { categorySlug },
  searchParams,
}: {
  params: { categorySlug: string };
  searchParams: CatalogSearchParams;
}) {
  return <CatalogPage categorySlug={categorySlug} searchParams={searchParams} />;
}
