// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CART_HREF,
  GENDERS,
  GENDER_FILTER,
  GENDERED_CATEGORY_SLUGS,
  HOME_HREF,
  LOGIN_HREF,
  PRODUCTS_HREF,
  WISHLIST_HREF,
  catalogHref,
  categoryHref,
  genderHref,
  productHref,
  subcategoryGenderHref,
  subcategoryHref,
} from '@/lib/routes';

describe('routes', () => {
  it('builds product URLs (product-card AC1)', () => {
    expect(productHref('tideline-6-0-performance-shortboard')).toBe('/products/tideline-6-0-performance-shortboard');
  });

  it('builds category and subcategory URLs (site-nav AC5)', () => {
    expect(categoryHref('surfboards')).toBe('/products/category/surfboards');
    expect(subcategoryHref('surfboards', 'soft-top-beginner')).toBe('/products/category/surfboards?sub=soft-top-beginner');
  });

  it('builds gender URLs for gendered categories (site-nav AC5)', () => {
    expect(genderHref('clothing', 'men')).toBe('/products/category/clothing?gender=men');
    expect(genderHref('clothing', 'women')).toBe('/products/category/clothing?gender=women');
    expect(GENDERED_CATEGORY_SLUGS).toEqual(['clothing']);
  });

  it('builds subcategory + gender URLs (site-nav AC5)', () => {
    expect(subcategoryGenderHref('clothing', 'shorts', 'men')).toBe('/products/category/clothing?sub=shorts&gender=men');
    expect(subcategoryGenderHref('clothing', 'tops', 'women')).toBe('/products/category/clothing?sub=tops&gender=women');
  });

  it('defines what ?gender= matches: Unisex counts for both (product-content-model AC12)', () => {
    expect(GENDERS).toEqual(['men', 'women']);
    expect(GENDER_FILTER).toEqual({ men: ['Men', 'Unisex'], women: ['Women', 'Unisex'] });
  });

  it('exposes the fixed site URLs used by the header (site-nav AC8)', () => {
    expect([HOME_HREF, LOGIN_HREF, WISHLIST_HREF, CART_HREF]).toEqual(['/', '/auth/login', '/account#wishlist', '/cart']);
  });

  describe('catalogHref (catalog-listing-page AC1, AC3, AC7)', () => {
    it('builds the all-products and category URLs', () => {
      expect(PRODUCTS_HREF).toBe('/products');
      expect(catalogHref()).toBe('/products');
      expect(catalogHref({ categorySlug: 'surfboards' })).toBe('/products/category/surfboards');
    });

    it('matches the existing builders for the same inputs', () => {
      expect(catalogHref({ categorySlug: 'surfboards', subcategorySlug: 'longboard' })).toBe(subcategoryHref('surfboards', 'longboard'));
      expect(catalogHref({ categorySlug: 'clothing', gender: 'men' })).toBe(genderHref('clothing', 'men'));
      expect(catalogHref({ categorySlug: 'clothing', subcategorySlug: 'shorts', gender: 'women' })).toBe(
        subcategoryGenderHref('clothing', 'shorts', 'women')
      );
    });

    it('appends ?page last and omits it on page 1', () => {
      expect(catalogHref({ page: 1 })).toBe('/products');
      expect(catalogHref({ page: 2 })).toBe('/products?page=2');
      expect(catalogHref({ categorySlug: 'clothing', subcategorySlug: 'shorts', gender: 'men', page: 3 })).toBe(
        '/products/category/clothing?sub=shorts&gender=men&page=3'
      );
    });

    it('never puts gender on a non-gendered category, and no sub on /products', () => {
      expect(catalogHref({ categorySlug: 'surfboards', gender: 'men', page: 2 })).toBe('/products/category/surfboards?page=2');
      expect(catalogHref({ subcategorySlug: 'longboard', gender: 'men' })).toBe('/products');
    });
  });
});
