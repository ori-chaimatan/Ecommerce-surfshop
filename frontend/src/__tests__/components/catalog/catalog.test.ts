// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  buildBreadcrumb,
  buildPagination,
  buildSidebar,
  productListQuery,
  resolveCatalogParams,
  type CatalogLocation,
} from '@/components/catalog/catalog';
import { buildNavMenu } from '@/components/site-nav/nav-menu';
import type { StrapiNavCategory, SubcategoryGenders } from '@/lib/strapi/navigation';

function cat(Slug: string, Name: string, subs: [string, string, string?][]): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n, l]) => ({ Slug: s, Name: n, NavLabel: l ?? null })) };
}

const CATEGORIES = [
  cat('surfboards', 'Surfboards', [['longboard', 'Longboard'], ['fun-board', 'Fun Board']]),
  cat('accessories', 'Accessories', [['fins', 'Fins'], ['traction', 'Traction']]),
  cat('wetsuits', 'Wetsuits', [['mens-wetsuits', "Men's Wetsuits", 'Men'], ['womens-wetsuits', "Women's Wetsuits", 'Women']]),
  cat('clothing', 'Clothing', [['tshirts-tanks', 'T-Shirts & Tanks'], ['shorts', 'Shorts'], ['tops', 'Tops']]),
];

const SUBCATEGORY_GENDERS: SubcategoryGenders = { 'tshirts-tanks': ['Unisex'], shorts: ['Men'], tops: ['Women'] };

function resolve(categorySlug: string | undefined, searchParams: Record<string, string | string[] | undefined> = {}) {
  return resolveCatalogParams(CATEGORIES, categorySlug, searchParams);
}

function ok(categorySlug: string | undefined, searchParams: Record<string, string | string[] | undefined> = {}): CatalogLocation {
  const result = resolve(categorySlug, searchParams);
  if (result.kind !== 'ok') throw new Error(`expected ok, got ${result.kind}`);
  return result.location;
}

describe('resolveCatalogParams', () => {
  it('resolves /products to all products on page 1 (AC1, AC4)', () => {
    expect(ok(undefined)).toEqual({ page: 1 });
  });

  it('resolves a category and one of its subcategories (AC1)', () => {
    const location = ok('surfboards', { sub: 'longboard' });
    expect(location.category?.Slug).toBe('surfboards');
    expect(location.subcategory?.Slug).toBe('longboard');
    expect(location.gender).toBeUndefined();
  });

  it('404s an unknown category, an unknown subcategory, or one from another category (AC4)', () => {
    expect(resolve('nope').kind).toBe('not-found');
    expect(resolve('surfboards', { sub: 'nope' }).kind).toBe('not-found');
    expect(resolve('surfboards', { sub: 'fins' }).kind).toBe('not-found');
  });

  it('uses ?gender only on Clothing, and ignores unknown values (AC3)', () => {
    expect(ok('clothing', { gender: 'men' }).gender).toBe('men');
    expect(ok('clothing', { gender: 'women', sub: 'tops' }).gender).toBe('women');
    expect(ok('clothing', { gender: 'kids' }).gender).toBeUndefined();
    expect(ok('surfboards', { gender: 'men' }).gender).toBeUndefined();
    expect(ok(undefined, { gender: 'men' }).gender).toBeUndefined();
  });

  it('ignores ?sub on /products and an empty ?sub (AC4)', () => {
    expect(ok(undefined, { sub: 'longboard' })).toEqual({ page: 1 });
    expect(ok('surfboards', { sub: '' }).subcategory).toBeUndefined();
  });

  it('parses ?page and 404s anything but an integer ≥ 1 (AC4)', () => {
    expect(ok(undefined, { page: '2' }).page).toBe(2);
    ['0', '-1', 'abc', '1.5', ''].forEach((page) => expect(resolve(undefined, { page }).kind).toBe('not-found'));
  });

  it('takes the first value of a repeated param (AC4)', () => {
    const location = ok('clothing', { sub: ['shorts', 'tops'], gender: ['men', 'women'], page: ['2', '3'] });
    expect([location.subcategory?.Slug, location.gender, location.page]).toEqual(['shorts', 'men', 2]);
  });
});

describe('productListQuery', () => {
  it('maps the location to server-side filters, with gender via GENDER_FILTER (AC2)', () => {
    expect(productListQuery(ok(undefined, { page: '2' }))).toEqual({ page: 2 });
    expect(productListQuery(ok('clothing', { sub: 'shorts', gender: 'men' }))).toEqual({
      categorySlug: 'clothing',
      subcategorySlug: 'shorts',
      genders: ['Men', 'Unisex'],
      page: 1,
    });
  });
});

describe('buildBreadcrumb (AC6)', () => {
  it('reads Home / All Products on /products', () => {
    expect(buildBreadcrumb(ok(undefined))).toEqual([{ label: 'Home', href: '/' }, { label: 'All Products' }]);
  });

  it('links every item but the last', () => {
    expect(buildBreadcrumb(ok('surfboards'))).toEqual([{ label: 'Home', href: '/' }, { label: 'Surfboards' }]);
    expect(buildBreadcrumb(ok('wetsuits', { sub: 'mens-wetsuits' }))).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Wetsuits', href: '/products/category/wetsuits' },
      { label: "Men's Wetsuits" },
    ]);
  });

  it('adds the gender for Clothing', () => {
    expect(buildBreadcrumb(ok('clothing', { gender: 'men', sub: 'shorts' }))).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Clothing', href: '/products/category/clothing' },
      { label: 'Men', href: '/products/category/clothing?gender=men' },
      { label: 'Shorts' },
    ]);
    expect(buildBreadcrumb(ok('clothing', { gender: 'women' })).at(-1)).toEqual({ label: 'Women' });
  });
});

describe('buildSidebar (AC8)', () => {
  const items = buildNavMenu(CATEGORIES, SUBCATEGORY_GENDERS);

  it('has one group per category in Strapi order, "All <Category>" first, NavLabel ?? Name', () => {
    const groups = buildSidebar(items, ok('wetsuits'));
    expect(groups.map((g) => g.label)).toEqual(['Surfboards', 'Accessories', 'Wetsuits', 'Clothing']);
    expect(groups[2].links.map((l) => [l.label, l.href])).toEqual([
      ['All Wetsuits', '/products/category/wetsuits'],
      ['Men', '/products/category/wetsuits?sub=mens-wetsuits'],
      ['Women', '/products/category/wetsuits?sub=womens-wetsuits'],
    ]);
    expect(groups[2].subgroups).toEqual([]);
  });

  it('marks the active link and opens only its group', () => {
    const groups = buildSidebar(items, ok('surfboards', { sub: 'longboard' }));
    expect(groups.map((g) => g.open)).toEqual([true, false, false, false]);
    expect(groups[0].links.filter((l) => l.active).map((l) => l.label)).toEqual(['Longboard']);

    const all = buildSidebar(items, ok('surfboards'));
    expect(all[0].links.filter((l) => l.active).map((l) => l.label)).toEqual(['All Surfboards']);
  });

  it('gives Clothing "Shop All Clothing" plus Men / Women subgroups with "All Men" / "All Women" first', () => {
    const clothing = buildSidebar(items, ok('clothing'))[3];
    expect(clothing.links.map((l) => [l.label, l.href, l.active])).toEqual([['Shop All Clothing', '/products/category/clothing', true]]);
    expect(clothing.subgroups.map((s) => [s.label, s.open, s.links.map((l) => l.label)])).toEqual([
      ['Men', false, ['All Men', 'T-Shirts & Tanks', 'Shorts']],
      ['Women', false, ['All Women', 'T-Shirts & Tanks', 'Tops']],
    ]);
  });

  it('opens the active gender subgroup', () => {
    const clothing = buildSidebar(items, ok('clothing', { gender: 'women', sub: 'tops' }))[3];
    expect(clothing.open).toBe(true);
    expect(clothing.subgroups.map((s) => s.open)).toEqual([false, true]);
    expect(clothing.subgroups[1].links.filter((l) => l.active).map((l) => l.href)).toEqual([
      '/products/category/clothing?sub=tops&gender=women',
    ]);
  });

  it('has nothing open or active on /products', () => {
    const groups = buildSidebar(items, ok(undefined));
    expect(groups.every((g) => !g.open && g.links.every((l) => !l.active))).toBe(true);
  });
});

describe('buildPagination (AC7)', () => {
  it('renders nothing for a single page', () => {
    expect(buildPagination(ok(undefined), 1)).toBeNull();
    expect(buildPagination(ok(undefined), 0)).toBeNull();
  });

  it('gives 17 products 2 pages: page 1 has Next only, page 2 has Prev only', () => {
    expect(buildPagination(ok(undefined), 2)).toEqual({
      nextHref: '/products?page=2',
      pages: [
        { number: 1, href: '/products', current: true },
        { number: 2, href: '/products?page=2', current: false },
      ],
    });
    expect(buildPagination(ok(undefined, { page: '2' }), 2)).toEqual({
      prevHref: '/products',
      pages: [
        { number: 1, href: '/products', current: false },
        { number: 2, href: '/products?page=2', current: true },
      ],
    });
  });

  it('numbers every page of a larger (mocked) catalog and keeps ?sub and ?gender', () => {
    const pagination = buildPagination(ok('clothing', { sub: 'shorts', gender: 'men', page: '4' }), 7)!;
    expect(pagination.pages.map((p) => p.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(pagination.pages.find((p) => p.current)?.number).toBe(4);
    expect(pagination.pages[0].href).toBe('/products/category/clothing?sub=shorts&gender=men');
    expect(pagination.prevHref).toBe('/products/category/clothing?sub=shorts&gender=men&page=3');
    expect(pagination.nextHref).toBe('/products/category/clothing?sub=shorts&gender=men&page=5');
  });
});
