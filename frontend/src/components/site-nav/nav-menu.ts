import {
  GENDERED_CATEGORY_SLUGS,
  GENDERS,
  GENDER_FILTER,
  categoryHref,
  genderHref,
  subcategoryGenderHref,
  subcategoryHref,
} from '@/lib/routes';
import type { StrapiNavCategory, SubcategoryGenders } from '@/lib/strapi/navigation';
import { texts } from './site-nav-texts';

export interface NavLink {
  label: string;
  href: string;
}

export interface NavColumn {
  head?: NavLink;
  allLink?: NavLink;
  links: NavLink[];
}

export interface NavItem {
  label: string;
  href: string;
  columns: NavColumn[];
}

function subcategoryLinks(category: StrapiNavCategory): NavLink[] {
  return category.Subcategories.map((sub) => ({
    label: sub.NavLabel || sub.Name,
    href: subcategoryHref(category.Slug, sub.Slug),
  }));
}

export function buildNavMenu(categories: StrapiNavCategory[], subcategoryGenders: SubcategoryGenders | null = null): NavItem[] {
  return categories.map((category) => {
    const href = categoryHref(category.Slug);

    if (!GENDERED_CATEGORY_SLUGS.includes(category.Slug)) {
      return {
        label: category.Name,
        href,
        columns: [{ allLink: { label: texts.allCategory(category.Name), href }, links: subcategoryLinks(category) }],
      };
    }

    return {
      label: category.Name,
      href,
      columns: GENDERS.map((gender) => ({
        head: { label: texts[gender], href: genderHref(category.Slug, gender) },
        links: category.Subcategories.filter(
          (sub) => !subcategoryGenders || (subcategoryGenders[sub.Slug] ?? []).some((g) => GENDER_FILTER[gender].includes(g))
        ).map((sub) => ({
          label: sub.NavLabel || sub.Name,
          href: subcategoryGenderHref(category.Slug, sub.Slug, gender),
        })),
      })),
    };
  });
}
