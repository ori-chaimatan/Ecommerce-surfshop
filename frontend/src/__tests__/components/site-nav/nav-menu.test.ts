// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildNavMenu } from '@/components/site-nav/nav-menu';
import type { StrapiNavCategory, SubcategoryGenders } from '@/lib/strapi/navigation';

function cat(Slug: string, Name: string, subs: [string, string, string?][] = []): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n, l]) => ({ Slug: s, Name: n, NavLabel: l ?? null })) };
}

// Today's Strapi data, in id order.
const STRAPI = [
  cat('surfboards', 'Surfboards', [['performance-shortboard', 'Performance Shortboard'], ['longboard', 'Longboard']]),
  cat('accessories', 'Accessories', [['fins', 'Fins']]),
  cat('wetsuits', 'Wetsuits', [['mens-wetsuits', "Men's Wetsuits", 'Men'], ['womens-wetsuits', "Women's Wetsuits", 'Women']]),
  cat('clothing', 'Clothing', [['tshirts-tanks', 'T-Shirts & Tanks'], ['shorts', 'Shorts'], ['boardshorts', 'Boardshorts'], ['tops', 'Tops'], ['swimmers', 'Swimmers']]),
];

// Genders of each clothing subcategory's products, as getSubcategoryGenders returns them.
const GENDERS: SubcategoryGenders = {
  'tshirts-tanks': ['Unisex'],
  shorts: ['Men'],
  boardshorts: ['Men'],
  tops: ['Women'],
  // swimmers: no products
};

describe('buildNavMenu', () => {
  it('turns every Strapi category into one menu item, in Strapi order (AC1, AC2)', () => {
    const menu = buildNavMenu(STRAPI);

    expect(menu.map((i) => [i.label, i.href])).toEqual([
      ['Surfboards', '/products/category/surfboards'],
      ['Accessories', '/products/category/accessories'],
      ['Wetsuits', '/products/category/wetsuits'],
      ['Clothing', '/products/category/clothing'],
    ]);
  });

  it('gives a regular item one column: "All <Name>" first, then its subcategories (AC3, AC5)', () => {
    const [surfboards] = buildNavMenu(STRAPI);

    expect(surfboards).toEqual({
      label: 'Surfboards',
      href: '/products/category/surfboards',
      columns: [
        {
          allLink: { label: 'All Surfboards', href: '/products/category/surfboards' },
          links: [
            { label: 'Performance Shortboard', href: '/products/category/surfboards?sub=performance-shortboard' },
            { label: 'Longboard', href: '/products/category/surfboards?sub=longboard' },
          ],
        },
      ],
    });
  });

  it('gives Clothing a Men and a Women column, headed by gender links (AC3, AC5)', () => {
    const clothing = buildNavMenu(STRAPI, GENDERS)[3];

    expect(clothing.label).toBe('Clothing');
    expect(clothing.href).toBe('/products/category/clothing');
    expect(clothing.columns.map((c) => c.head)).toEqual([
      { label: 'Men', href: '/products/category/clothing?gender=men' },
      { label: 'Women', href: '/products/category/clothing?gender=women' },
    ]);
    expect(clothing.columns.every((c) => c.allLink === undefined)).toBe(true);
  });

  it('lists under each gender only the subcategories with a product for it, Unisex under both, in Strapi order (AC3)', () => {
    const [men, women] = buildNavMenu(STRAPI, GENDERS)[3].columns;

    expect(men.links).toEqual([
      { label: 'T-Shirts & Tanks', href: '/products/category/clothing?sub=tshirts-tanks&gender=men' },
      { label: 'Shorts', href: '/products/category/clothing?sub=shorts&gender=men' },
      { label: 'Boardshorts', href: '/products/category/clothing?sub=boardshorts&gender=men' },
    ]);
    expect(women.links).toEqual([
      { label: 'T-Shirts & Tanks', href: '/products/category/clothing?sub=tshirts-tanks&gender=women' },
      { label: 'Tops', href: '/products/category/clothing?sub=tops&gender=women' },
    ]);
  });

  it('shows a subcategory under both genders when it has both Men and Women products (AC3)', () => {
    const [men, women] = buildNavMenu(STRAPI, { ...GENDERS, shorts: ['Men', 'Women'] })[3].columns;

    expect(men.links.map((l) => l.label)).toContain('Shorts');
    expect(women.links.map((l) => l.label)).toContain('Shorts');
  });

  it('omits a subcategory with no products from both columns (AC3)', () => {
    const [men, women] = buildNavMenu(STRAPI, GENDERS)[3].columns;

    expect([...men.links, ...women.links].map((l) => l.label)).not.toContain('Swimmers');
  });

  it('falls back to every Clothing subcategory under both genders when gender data is unavailable (AC3, AC11)', () => {
    const [men, women] = buildNavMenu(STRAPI, null)[3].columns;
    const all = ['T-Shirts & Tanks', 'Shorts', 'Boardshorts', 'Tops', 'Swimmers'];

    expect(men.links.map((l) => l.label)).toEqual(all);
    expect(women.links.map((l) => l.label)).toEqual(all);
    expect(women.links[4].href).toBe('/products/category/clothing?sub=swimmers&gender=women');
  });

  it('leaves non-gendered categories alone — Wetsuits keeps its Men/Women subcategories (AC3)', () => {
    const wetsuits = buildNavMenu(STRAPI, GENDERS)[2];

    expect(wetsuits.columns).toHaveLength(1);
    expect(wetsuits.columns[0].head).toBeUndefined();
    expect(wetsuits.columns[0].allLink).toEqual({ label: 'All Wetsuits', href: '/products/category/wetsuits' });
    expect(wetsuits.columns[0].links.map((l) => [l.label, l.href])).toEqual([
      ['Men', '/products/category/wetsuits?sub=mens-wetsuits'],
      ['Women', '/products/category/wetsuits?sub=womens-wetsuits'],
    ]);
  });

  it('labels subcategories with NavLabel, falling back to Name (AC4)', () => {
    expect(buildNavMenu(STRAPI)[2].columns[0].links.map((l) => l.label)).toEqual(['Men', 'Women']);
    expect(buildNavMenu(STRAPI)[0].columns[0].links.map((l) => l.label)).toEqual(['Performance Shortboard', 'Longboard']);
  });

  it('returns an empty menu for no categories (AC11)', () => {
    expect(buildNavMenu([])).toEqual([]);
  });
});
