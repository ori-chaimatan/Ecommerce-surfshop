export const GENDERS = ['men', 'women'] as const;
export type Gender = (typeof GENDERS)[number];

export type StrapiGender = 'Men' | 'Women' | 'Unisex';

export const GENDER_FILTER: Record<Gender, StrapiGender[]> = {
  men: ['Men', 'Unisex'],
  women: ['Women', 'Unisex'],
};

export const GENDERED_CATEGORY_SLUGS = ['clothing'];

export const HOME_HREF = '/';
export const PRODUCTS_HREF = '/products';
export const LOGIN_HREF = '/auth/login';
export const WISHLIST_HREF = '/account#wishlist';
export const CART_HREF = '/cart';
export const CHECKOUT_HREF = '/checkout';
export const REGISTER_HREF = '/auth/register';

/** The storefront's own cart API (route handlers in app/api/cart). */
export const CART_API_HREF = '/api/cart';
export const CART_LINES_API_HREF = '/api/cart/lines';
/** The storefront's place-order route handler (app/api/checkout). */
export const CHECKOUT_API_HREF = '/api/checkout';

const withNext = (path: string, next?: string) => (next ? `${path}?next=${encodeURIComponent(next)}` : path);

/** Sign-in, returning to `next` (a same-site path) afterwards. */
export function loginHref(next?: string) {
  return withNext(LOGIN_HREF, next);
}

export function registerHref(next?: string) {
  return withNext(REGISTER_HREF, next);
}

export function orderConfirmationHref(orderNumber: string) {
  return `/checkout/confirmation/${encodeURIComponent(orderNumber)}`;
}

export function productHref(productSlug: string) {
  return `/products/${productSlug}`;
}

export function categoryHref(categorySlug: string) {
  return `/products/category/${categorySlug}`;
}

export function subcategoryHref(categorySlug: string, subcategorySlug: string) {
  return `${categoryHref(categorySlug)}?sub=${subcategorySlug}`;
}

export function genderHref(categorySlug: string, gender: Gender) {
  return `${categoryHref(categorySlug)}?gender=${gender}`;
}

export function subcategoryGenderHref(categorySlug: string, subcategorySlug: string, gender: Gender) {
  return `${subcategoryHref(categorySlug, subcategorySlug)}&gender=${gender}`;
}

export interface CatalogHrefOptions {
  categorySlug?: string;
  subcategorySlug?: string;
  gender?: Gender;
  page?: number;
}

/** A catalog listing URL: `?sub` and `?gender` only on a category (gender only on gendered ones), `?page` omitted on page 1. */
export function catalogHref({ categorySlug, subcategorySlug, gender, page }: CatalogHrefOptions = {}) {
  const query: string[] = [];
  if (categorySlug && subcategorySlug) query.push(`sub=${subcategorySlug}`);
  if (categorySlug && gender && GENDERED_CATEGORY_SLUGS.includes(categorySlug)) query.push(`gender=${gender}`);
  if (page && page > 1) query.push(`page=${page}`);

  const path = categorySlug ? categoryHref(categorySlug) : PRODUCTS_HREF;
  return query.length ? `${path}?${query.join('&')}` : path;
}
