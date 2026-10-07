import Link from 'next/link';
import { Fragment } from 'react';
import { notFound } from 'next/navigation';
import { buildNavMenu } from '@/components/site-nav/nav-menu';
import { categoryHref } from '@/lib/routes';
import { getNavigation } from '@/lib/strapi/navigation';
import { getProductList } from '@/lib/strapi/products';
import { ProductCard } from '@/shared/components/product-card';
import {
  buildBreadcrumb,
  buildPagination,
  buildSidebar,
  productListQuery,
  resolveCatalogParams,
  type BreadcrumbItem,
  type CatalogSearchParams,
} from './catalog';
import { texts } from './catalog-texts';
import { CatalogPagination } from './CatalogPagination';
import { CatalogSidebar } from './CatalogSidebar';

const PRIORITY_CARDS = 4;
const CONTAINER = 'mx-auto max-w-[1240px] px-6 max-[480px]:px-4';

interface CatalogPageProps {
  categorySlug?: string;
  searchParams: CatalogSearchParams;
}

export async function CatalogPage({ categorySlug, searchParams }: CatalogPageProps) {
  const { categories, subcategoryGenders } = await getNavigation();
  // No categories means Strapi is unreachable: show "unavailable" rather than 404 every category (AC10).
  const resolved = categories.length ? resolveCatalogParams(categories, categorySlug, searchParams) : null;
  if (resolved?.kind === 'not-found') notFound();

  const location = resolved?.location;
  const list = location ? await getProductList(productListQuery(location)) : null;
  if (location && list && location.page > Math.max(1, list.pageCount)) notFound();

  const view = location && list ? { location, list } : null;
  const breadcrumb: BreadcrumbItem[] = view ? buildBreadcrumb(view.location) : [{ label: texts.home }];
  const sidebar = view ? buildSidebar(buildNavMenu(categories, subcategoryGenders), view.location) : null;
  const pagination = view ? buildPagination(view.location, view.list.pageCount) : null;
  const category = view?.location.category;

  return (
    <main>
      <section className="border-b border-border pb-5 pt-7">
        <div className={CONTAINER}>
          <nav
            aria-label={texts.breadcrumbLabel}
            className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.04em] text-muted"
          >
            {breadcrumb.map((item, index) => (
              <Fragment key={`${index}-${item.label}`}>
                {index > 0 && (
                  <span aria-hidden className="opacity-50">
                    /
                  </span>
                )}
                {item.href ? (
                  <Link href={item.href} className="hover:text-horizon">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-ink">{item.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
          {view && (
            <h1 className="mt-2.5 font-display text-[clamp(30px,4.5vw,52px)] font-extrabold uppercase leading-[0.95] tracking-[0.01em] text-ink [text-wrap:balance]">
              {category?.Name ?? texts.allProducts}
            </h1>
          )}
        </div>
      </section>

      <section className="pb-20 pt-9">
        <div className={`${CONTAINER} grid items-start gap-10 ${sidebar ? 'grid-cols-[248px_1fr] max-[900px]:grid-cols-1' : 'grid-cols-1'}`}>
          {sidebar && <CatalogSidebar groups={sidebar} />}

          <div>
            {view && view.list.total > 0 && (
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
                <span className="text-sm text-muted">{texts.results(view.list.total)}</span>
              </div>
            )}

            {!view ? (
              <p className="py-16 text-center text-base text-ink">{texts.unavailable}</p>
            ) : view.list.products.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-base text-ink">{texts.empty}</p>
                {category && (
                  <Link
                    href={categoryHref(category.Slug)}
                    className="mt-3 inline-block text-sm font-semibold text-horizon hover:text-horizon-deep"
                  >
                    {texts.allCategory(category.Name)}
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-5 max-[1080px]:grid-cols-3 max-[760px]:grid-cols-2 max-[760px]:gap-3.5">
                {view.list.products.map((product, index) => (
                  <ProductCard key={product.slug} product={product} priority={index < PRIORITY_CARDS} />
                ))}
              </div>
            )}

            {pagination && <CatalogPagination pagination={pagination} />}
          </div>
        </div>
      </section>
    </main>
  );
}
