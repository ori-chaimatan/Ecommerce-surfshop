// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { CART_HREF, HOME_HREF, LOGIN_HREF, NAV_GROUPS, WISHLIST_HREF, categoryHref, productHref, subcategoryHref } from '@/lib/routes';

describe('routes', () => {
  it('builds product URLs (product-card AC1)', () => {
    expect(productHref('tideline-6-0-performance-shortboard')).toBe('/products/tideline-6-0-performance-shortboard');
  });

  it('builds category and subcategory URLs (site-nav AC5)', () => {
    expect(categoryHref('surfboards')).toBe('/products/category/surfboards');
    expect(subcategoryHref('surfboards', 'soft-top-beginner')).toBe('/products/category/surfboards?sub=soft-top-beginner');
  });

  it('exposes the fixed site URLs used by the header (site-nav AC8)', () => {
    expect([HOME_HREF, LOGIN_HREF, WISHLIST_HREF, CART_HREF]).toEqual(['/', '/auth/login', '/account#wishlist', '/cart']);
  });

  it('exports the Clothing group for catalog-listing-page to resolve (site-nav AC5)', () => {
    expect(NAV_GROUPS).toEqual([
      {
        slug: 'clothing',
        label: 'Clothing',
        columns: [
          { label: 'Men', categorySlug: 'mens-clothing' },
          { label: 'Women', categorySlug: 'womens-clothing' },
        ],
      },
    ]);
  });
});
