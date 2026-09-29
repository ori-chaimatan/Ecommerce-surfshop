import { NAV_GROUPS, categoryHref, subcategoryHref } from '@/lib/routes';
import type { StrapiNavCategory } from '@/lib/strapi/navigation';
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

export function buildNavMenu(categories: StrapiNavCategory[]): NavItem[] {
  const bySlug = new Map(categories.map((c) => [c.Slug, c]));
  const groupOf = (slug: string) => NAV_GROUPS.find((g) => g.columns.some((col) => col.categorySlug === slug));
  const emittedGroups = new Set<string>();
  const items: NavItem[] = [];

  for (const category of categories) {
    const group = groupOf(category.Slug);

    if (!group) {
      const href = categoryHref(category.Slug);
      items.push({
        label: category.Name,
        href,
        columns: [{ allLink: { label: texts.allCategory(category.Name), href }, links: subcategoryLinks(category) }],
      });
      continue;
    }

    if (emittedGroups.has(group.slug)) continue;
    emittedGroups.add(group.slug);

    items.push({
      label: group.label,
      href: categoryHref(group.slug),
      columns: group.columns.flatMap((col) => {
        const member = bySlug.get(col.categorySlug);
        return member
          ? [{ head: { label: col.label, href: categoryHref(member.Slug) }, links: subcategoryLinks(member) }]
          : [];
      }),
    });
  }

  return items;
}
