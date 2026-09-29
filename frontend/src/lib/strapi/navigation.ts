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
