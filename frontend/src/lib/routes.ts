/**
 * Every storefront URL is built here, so links and the pages that serve them
 * can't drift apart. catalog-listing-page and product-detail-page must serve these.
 *
 * Reserved slugs: `category` (product slugs share `/products/<slug>`) and every
 * NAV_GROUPS slug (group slugs share `/products/category/<slug>`).
 */

/**
 * Menu items that group several Strapi categories into one. The group slug is a
 * virtual category: `/products/category/<slug>` resolves to the categories in its
 * columns. The Strapi model has no notion of this.
 */
export const NAV_GROUPS = [
  {
    slug: 'clothing',
    label: 'Clothing',
    columns: [
      { label: 'Men', categorySlug: 'mens-clothing' },
      { label: 'Women', categorySlug: 'womens-clothing' },
    ],
  },
];

export const HOME_HREF = '/';
export const LOGIN_HREF = '/auth/login';
export const WISHLIST_HREF = '/account#wishlist';
export const CART_HREF = '/cart';

export function productHref(productSlug: string) {
  return `/products/${productSlug}`;
}

export function categoryHref(categorySlug: string) {
  return `/products/category/${categorySlug}`;
}

export function subcategoryHref(categorySlug: string, subcategorySlug: string) {
  return `${categoryHref(categorySlug)}?sub=${subcategorySlug}`;
}
