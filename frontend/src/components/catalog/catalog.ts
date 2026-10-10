import type { NavItem } from '@/components/site-nav/nav-menu';
import {
  GENDERED_CATEGORY_SLUGS,
  GENDERS,
  GENDER_FILTER,
  HOME_HREF,
  catalogHref,
  categoryHref,
  genderHref,
  type Gender,
} from '@/lib/routes';
import type { StrapiNavCategory, StrapiNavSubcategory } from '@/lib/strapi/navigation';
import type { ProductListQuery } from '@/lib/strapi/products';
import { texts } from './catalog-texts';

export type CatalogSearchParams = Record<string, string | string[] | undefined>;

export interface CatalogLocation {
  category?: StrapiNavCategory;
  subcategory?: StrapiNavSubcategory;
  gender?: Gender;
  page: number;
}

export type ResolvedCatalog = { kind: 'not-found' } | { kind: 'ok'; location: CatalogLocation };

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface SidebarLink {
  label: string;
  href: string;
  active: boolean;
}

export interface SidebarSubgroup {
  key: string;
  label: string;
  open: boolean;
  links: SidebarLink[];
}

export interface SidebarGroup extends SidebarSubgroup {
  subgroups: SidebarSubgroup[];
}

export interface Pagination {
  prevHref?: string;
  nextHref?: string;
  pages: { number: number; href: string; current: boolean }[];
}

const NOT_FOUND: ResolvedCatalog = { kind: 'not-found' };

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePage(value: string | undefined) {
  if (value === undefined) return 1;
  return /^\d+$/.test(value) && Number(value) >= 1 ? Number(value) : null;
}

function isGender(value: string | undefined): value is Gender {
  return GENDERS.includes(value as Gender);
}

/** Validates the route + query against the Strapi taxonomy (AC3, AC4). */
export function resolveCatalogParams(
  categories: StrapiNavCategory[],
  categorySlug: string | undefined,
  searchParams: CatalogSearchParams
): ResolvedCatalog {
  const page = parsePage(first(searchParams.page));
  if (page === null) return NOT_FOUND;
  if (categorySlug === undefined) return { kind: 'ok', location: { page } };

  const category = categories.find((c) => c.Slug === categorySlug);
  if (!category) return NOT_FOUND;

  const subSlug = first(searchParams.sub);
  const subcategory = subSlug ? category.Subcategories.find((s) => s.Slug === subSlug) : undefined;
  if (subSlug && !subcategory) return NOT_FOUND;

  const gender = first(searchParams.gender);
  const location: CatalogLocation = { category, page };
  if (subcategory) location.subcategory = subcategory;
  if (GENDERED_CATEGORY_SLUGS.includes(category.Slug) && isGender(gender)) location.gender = gender;
  return { kind: 'ok', location };
}

export function locationHref({ category, subcategory, gender }: CatalogLocation, page = 1) {
  return catalogHref({ categorySlug: category?.Slug, subcategorySlug: subcategory?.Slug, gender, page });
}

export function productListQuery({ category, subcategory, gender, page }: CatalogLocation): ProductListQuery {
  const query: ProductListQuery = { page };
  if (category) query.categorySlug = category.Slug;
  if (subcategory) query.subcategorySlug = subcategory.Slug;
  if (gender) query.genders = GENDER_FILTER[gender];
  return query;
}

/** Home / Category / (Gender) / Subcategory; every item but the last links (AC6). */
export function buildBreadcrumb({ category, subcategory, gender }: CatalogLocation): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: texts.home, href: HOME_HREF }];

  if (!category) {
    items.push({ label: texts.allProducts });
  } else {
    items.push({ label: category.Name, href: categoryHref(category.Slug) });
    if (gender) items.push({ label: texts[gender], href: genderHref(category.Slug, gender) });
    if (subcategory) items.push({ label: subcategory.Name });
  }

  const last = items[items.length - 1];
  items[items.length - 1] = { label: last.label };
  return items;
}

export function buildSidebar(items: NavItem[], location: CatalogLocation): SidebarGroup[] {
  const currentHref = locationHref(location);
  const currentCategoryHref = location.category ? categoryHref(location.category.Slug) : undefined;
  const link = (label: string, href: string): SidebarLink => ({ label, href, active: href === currentHref });

  return items.map((item) => {
    const gendered = item.columns.some((column) => column.head);
    const links = gendered ? [link(texts.shopAll(item.label), item.href)] : [];
    const subgroups: SidebarSubgroup[] = [];

    for (const column of item.columns) {
      if (column.head) {
        const subLinks = [link(texts.allGender(column.head.label), column.head.href), ...column.links.map((l) => link(l.label, l.href))];
        subgroups.push({ key: column.head.href, label: column.head.label, open: subLinks.some((l) => l.active), links: subLinks });
      } else {
        if (column.allLink) links.push(link(column.allLink.label, column.allLink.href));
        links.push(...column.links.map((l) => link(l.label, l.href)));
      }
    }

    const open = item.href === currentCategoryHref || links.some((l) => l.active) || subgroups.some((s) => s.open);
    return { key: item.href, label: item.label, open, links, subgroups };
  });
}

export function buildPagination(location: CatalogLocation, pageCount: number): Pagination | null {
  if (pageCount <= 1) return null;

  const pagination: Pagination = {
    pages: Array.from({ length: pageCount }, (_, i) => ({
      number: i + 1,
      href: locationHref(location, i + 1),
      current: i + 1 === location.page,
    })),
  };
  if (location.page > 1) pagination.prevHref = locationHref(location, location.page - 1);
  if (location.page < pageCount) pagination.nextHref = locationHref(location, location.page + 1);
  return pagination;
}
