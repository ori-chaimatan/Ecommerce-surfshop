import { GENDERED_CATEGORY_SLUGS, type StrapiGender } from '@/lib/routes';
import { strapiFetch } from './client';

const NAVIGATION_QUERY = new URLSearchParams({
  'fields[0]': 'Name',
  'fields[1]': 'Slug',
  'sort[0]': 'id:asc',
  'populate[Subcategories][fields][0]': 'Name',
  'populate[Subcategories][fields][1]': 'Slug',
  'populate[Subcategories][fields][2]': 'NavLabel',
  'populate[Subcategories][sort][0]': 'id:asc',
  'pagination[pageSize]': '100',
}).toString();

export interface StrapiNavSubcategory {
  Name: string;
  Slug: string;
  NavLabel?: string | null;
}

export interface StrapiNavCategory {
  Name: string;
  Slug: string;
  Subcategories: StrapiNavSubcategory[];
}

interface RawCategory {
  Name?: string | null;
  Slug?: string | null;
  Subcategories?: { Name?: string | null; Slug?: string | null; NavLabel?: string | null }[] | null;
}

function normalize(category: RawCategory): StrapiNavCategory | null {
  if (!category?.Name || !category.Slug) return null;
  return {
    Name: category.Name,
    Slug: category.Slug,
    Subcategories: (category.Subcategories ?? [])
      .filter((s): s is { Name: string; Slug: string; NavLabel?: string | null } => Boolean(s?.Name && s.Slug))
      .map(({ Name, Slug, NavLabel }) => ({ Name, Slug, NavLabel: NavLabel ?? null })),
  };
}

/** Server-only. Never throws: on any failure the nav renders without menu items. */
export async function getNavigationCategories(): Promise<StrapiNavCategory[]> {
  const json = (await strapiFetch(`categories?${NAVIGATION_QUERY}`, { label: 'navigation', fallback: null })) as {
    data?: unknown;
  } | null;

  if (!Array.isArray(json?.data)) {
    return [];
  }

  return json.data.map(normalize).filter((c: StrapiNavCategory | null): c is StrapiNavCategory => c !== null);
}

/** Subcategory slug → the Genders of its products (gendered categories only). */
export type SubcategoryGenders = Record<string, StrapiGender[]>;

const GENDER_PAGE_SIZE = 100;

function genderQuery(page: number) {
  const params = new URLSearchParams({
    'fields[0]': 'Gender',
    'populate[Subcategories][fields][0]': 'Slug',
    'pagination[page]': String(page),
    'pagination[pageSize]': String(GENDER_PAGE_SIZE),
  });
  GENDERED_CATEGORY_SLUGS.forEach((slug, i) => params.set(`filters[Category][Slug][$in][${i}]`, slug));
  return params.toString();
}

interface RawGenderPage {
  data?: { Gender?: StrapiGender | null; Subcategories?: { Slug?: string | null }[] | null }[];
  meta?: { pagination?: { pageCount?: number } };
}

export async function getSubcategoryGenders(): Promise<SubcategoryGenders | null> {
  const genders: SubcategoryGenders = {};

  for (let page = 1, pageCount = 1; page <= pageCount; page++) {
    const json = (await strapiFetch(`products?${genderQuery(page)}`, { label: 'navigation', fallback: null })) as RawGenderPage | null;
    if (!Array.isArray(json?.data)) return null;

    for (const product of json.data) {
      if (!product.Gender) continue;
      for (const sub of product.Subcategories ?? []) {
        if (!sub?.Slug) continue;
        const list = (genders[sub.Slug] ??= []);
        if (!list.includes(product.Gender)) list.push(product.Gender);
      }
    }
    pageCount = json.meta?.pagination?.pageCount ?? 1;
  }

  return genders;
}

export async function getNavigation(): Promise<{ categories: StrapiNavCategory[]; subcategoryGenders: SubcategoryGenders | null }> {
  const [categories, subcategoryGenders] = await Promise.all([getNavigationCategories(), getSubcategoryGenders()]);
  return { categories, subcategoryGenders };
}
