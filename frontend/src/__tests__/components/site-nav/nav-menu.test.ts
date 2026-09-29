// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { buildNavMenu } from '@/components/site-nav/nav-menu';
import type { StrapiNavCategory } from '@/lib/strapi/navigation';

function cat(Slug: string, Name: string, subs: [string, string, string?][] = []): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n, l]) => ({ Slug: s, Name: n, NavLabel: l ?? null })) };
}

// Today's Strapi data, in id order.
const STRAPI = [
  cat('surfboards', 'Surfboards', [['performance-shortboard', 'Performance Shortboard'], ['longboard', 'Longboard']]),
  cat('accessories', 'Accessories', [['fins', 'Fins']]),
  cat('wetsuits', 'Wetsuits', [['mens-wetsuits', "Men's Wetsuits", 'Men'], ['womens-wetsuits', "Women's Wetsuits", 'Women']]),
  cat('mens-clothing', "Men's Clothing", [['mens-shorts', "Men's Shorts", 'Shorts'], ['mens-boardshorts', "Men's Boardshorts", 'Boardshorts']]),
  cat('womens-clothing', "Women's Clothing", [['womens-tops', "Women's Tops", 'Tops']]),
];

describe('buildNavMenu', () => {
  it('keeps Strapi order and collapses the two clothing categories into one Clothing item (AC1, AC2)', () => {
    const menu = buildNavMenu(STRAPI);

    expect(menu.map((i) => i.label)).toEqual(['Surfboards', 'Accessories', 'Wetsuits', 'Clothing']);
    expect(menu[3].href).toBe('/products/category/clothing');
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

  it('gives Clothing a Men and a Women column headed by links to their categories (AC3)', () => {
    const clothing = buildNavMenu(STRAPI)[3];

    expect(clothing.columns).toEqual([
      {
        head: { label: 'Men', href: '/products/category/mens-clothing' },
        links: [
          { label: 'Shorts', href: '/products/category/mens-clothing?sub=mens-shorts' },
          { label: 'Boardshorts', href: '/products/category/mens-clothing?sub=mens-boardshorts' },
        ],
      },
      {
        head: { label: 'Women', href: '/products/category/womens-clothing' },
        links: [{ label: 'Tops', href: '/products/category/womens-clothing?sub=womens-tops' }],
      },
    ]);
  });

  it('labels subcategories with NavLabel, falling back to Name (AC4)', () => {
    const wetsuits = buildNavMenu(STRAPI)[2];
    expect(wetsuits.columns[0].links.map((l) => l.label)).toEqual(['Men', 'Women']);

    const surfboards = buildNavMenu(STRAPI)[0];
    expect(surfboards.columns[0].links.map((l) => l.label)).toEqual(['Performance Shortboard', 'Longboard']);
  });

  it('places the Clothing group where the first of its categories appears (AC2)', () => {
    const reordered = [STRAPI[4], STRAPI[0], STRAPI[3]];

    expect(buildNavMenu(reordered).map((i) => i.label)).toEqual(['Clothing', 'Surfboards']);
    // Column order still follows NAV_GROUPS, not Strapi.
    expect(buildNavMenu(reordered)[0].columns.map((c) => c.head?.label)).toEqual(['Men', 'Women']);
  });

  it('shows only the group columns whose categories exist, and drops the group when none do (AC2)', () => {
    expect(buildNavMenu([STRAPI[0], STRAPI[3]])[1].columns.map((c) => c.head?.label)).toEqual(['Men']);
    expect(buildNavMenu([STRAPI[0], STRAPI[1]]).map((i) => i.label)).toEqual(['Surfboards', 'Accessories']);
  });

  it('returns an empty menu for no categories (AC11)', () => {
    expect(buildNavMenu([])).toEqual([]);
  });
});
