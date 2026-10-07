import { CatalogPage } from '@/components/catalog';
import type { CatalogSearchParams } from '@/components/catalog/catalog';

export default function ProductsPage({ searchParams }: { searchParams: CatalogSearchParams }) {
  return <CatalogPage searchParams={searchParams} />;
}
