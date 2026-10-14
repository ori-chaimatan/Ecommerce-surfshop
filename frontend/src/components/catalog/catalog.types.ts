import type { CatalogSearchParams, Pagination, SidebarGroup } from './catalog';

export interface ICatalogPageProps {
  categorySlug?: string;
  searchParams: CatalogSearchParams;
}

export interface ICatalogPaginationProps {
  pagination: Pagination;
}

export interface ICatalogSidebarProps {
  groups: SidebarGroup[];
}
