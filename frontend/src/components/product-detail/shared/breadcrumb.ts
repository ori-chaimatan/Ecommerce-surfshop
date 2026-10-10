import { HOME_HREF } from '@/lib/routes';
import { texts } from '../product-detail-texts';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** What a breadcrumb needs from either detail view model. */
export interface BreadcrumbInput {
  name: string;
  category: { name: string; href: string };
  gender?: { label: string; href: string };
}

export function buildBreadcrumb(product: BreadcrumbInput | null): BreadcrumbItem[] {
  if (!product) return [{ label: texts.home }];
  return [
    { label: texts.home, href: HOME_HREF },
    { label: product.category.name, href: product.category.href },
    ...(product.gender ? [{ label: product.gender.label, href: product.gender.href }] : []),
    { label: product.name },
  ];
}
