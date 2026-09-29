export const GENDERS = ['men', 'women'] as const;
export type Gender = (typeof GENDERS)[number];

export type StrapiGender = 'Men' | 'Women' | 'Unisex';

export const GENDER_FILTER: Record<Gender, StrapiGender[]> = {
  men: ['Men', 'Unisex'],
  women: ['Women', 'Unisex'],
};

export const GENDERED_CATEGORY_SLUGS = ['clothing'];

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

export function genderHref(categorySlug: string, gender: Gender) {
  return `${categoryHref(categorySlug)}?gender=${gender}`;
}

export function subcategoryGenderHref(categorySlug: string, subcategorySlug: string, gender: Gender) {
  return `${subcategoryHref(categorySlug, subcategorySlug)}&gender=${gender}`;
}
