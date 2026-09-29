// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  CART_HREF,
  GENDERS,
  GENDER_FILTER,
  GENDERED_CATEGORY_SLUGS,
  HOME_HREF,
  LOGIN_HREF,
  WISHLIST_HREF,
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
});
