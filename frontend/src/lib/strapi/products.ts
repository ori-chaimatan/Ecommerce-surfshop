import type { StrapiGender } from '@/lib/routes';
import { toProductCard, type ProductCard, type StrapiProduct } from '@/shared/components/product-card/product-card';
import { strapiFetch } from './client';

export const PAGE_SIZE = 16;

export interface ProductListQuery {
  categorySlug?: string;
  subcategorySlug?: string;
  genders?: StrapiGender[];
  page: number;
}

export interface ProductList {
  products: ProductCard[];
  total: number;
  pageCount: number;
}

function productListQuery({ categorySlug, subcategorySlug, genders, page }: ProductListQuery) {
  const params = new URLSearchParams({
    'fields[0]': 'Name',
    'fields[1]': 'Slug',
    'fields[2]': 'Price',
    'populate[Images][fields][0]': 'url',
    'populate[Images][fields][1]': 'width',
    'populate[Images][fields][2]': 'height',
    'populate[Category][fields][0]': 'Slug',
    'sort[0]': 'id:asc',
    'pagination[page]': String(page),
    'pagination[pageSize]': String(PAGE_SIZE),
  });
  if (categorySlug) params.set('filters[Category][Slug][$eq]', categorySlug);
  if (subcategorySlug) params.set('filters[Subcategories][Slug][$eq]', subcategorySlug);
  genders?.forEach((gender, i) => params.set(`filters[Gender][$in][${i}]`, gender));
  return params.toString();
}

interface RawProductPage {
  data?: StrapiProduct[];
  meta?: { pagination?: { total?: unknown; pageCount?: unknown } };
}

export async function getProductList(query: ProductListQuery): Promise<ProductList | null> {
  const json = (await strapiFetch(`products?${productListQuery(query)}`, { label: 'products', fallback: null })) as RawProductPage | null;
  const total = json?.meta?.pagination?.total;
  const pageCount = json?.meta?.pagination?.pageCount;

  if (!Array.isArray(json?.data) || typeof total !== 'number' || typeof pageCount !== 'number') {
    return null;
  }

  return {
    products: json.data.map((product) => toProductCard(product)).filter((card): card is ProductCard => card !== null),
    total,
    pageCount,
  };
}

/** The Home "Featured gear" slider shows at most this many products. */
export const FEATURED_LIMIT = 8;

/** Products with `Featured` on, newest first (home-featured-gear). Null when Strapi fails. */
export async function getFeaturedProducts(): Promise<ProductCard[] | null> {
  const params = new URLSearchParams({
    'fields[0]': 'Name',
    'fields[1]': 'Slug',
    'fields[2]': 'Price',
    'populate[Images][fields][0]': 'url',
    'populate[Images][fields][1]': 'width',
    'populate[Images][fields][2]': 'height',
    'populate[Category][fields][0]': 'Slug',
    'filters[Featured][$eq]': 'true',
    'sort[0]': 'updatedAt:desc',
    'pagination[page]': '1',
    'pagination[pageSize]': String(FEATURED_LIMIT),
  });
  const json = (await strapiFetch(`products?${params.toString()}`, { label: 'featured-products', fallback: null })) as RawProductPage | null;
  if (!Array.isArray(json?.data)) return null;
  return json.data.map((product) => toProductCard(product)).filter((card): card is ProductCard => card !== null);
}
