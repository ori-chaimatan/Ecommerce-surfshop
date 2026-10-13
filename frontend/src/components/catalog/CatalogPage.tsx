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
} from './catalog';
import { styles } from './catalog-page.styles';
import type { ICatalogPageProps } from './catalog.types';
import { texts } from './catalog-texts';
import { CatalogPagination } from './CatalogPagination';
import { CatalogSidebar } from './CatalogSidebar';

const PRIORITY_CARDS = 4;

export const CatalogPage = async ({ categorySlug, searchParams }: ICatalogPageProps): Promise<React.JSX.Element> => {
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
      <section className={styles.header}>
        <div className={styles.container}>
          <nav aria-label={texts.breadcrumbLabel} className={styles.breadcrumb}>
            {breadcrumb.map((item, index) => (
              <Fragment key={`${index}-${item.label}`}>
                {index > 0 && (
                  <span aria-hidden className={styles.breadcrumbSeparator}>
                    /
                  </span>
                )}
                {item.href ? (
                  <Link href={item.href} className={styles.breadcrumbLink}>
                    {item.label}
                  </Link>
                ) : (
                  <span className={styles.breadcrumbCurrent}>{item.label}</span>
                )}
              </Fragment>
            ))}
          </nav>
          {view && (
            <h1 className={styles.title}>
              {category?.Name ?? texts.allProducts}
            </h1>
          )}
        </div>
      </section>

      <section className={styles.body}>
        <div className={`${styles.layout.base} ${styles.layout.columns[sidebar ? 'withSidebar' : 'single']}`}>
          {sidebar && <CatalogSidebar groups={sidebar} />}

          <div>
            {view && view.list.total > 0 && (
              <div className={styles.resultsBar}>
                <span className={styles.resultsCount}>{texts.results(view.list.total)}</span>
              </div>
            )}

            {!view ? (
              <p className={styles.unavailable}>{texts.unavailable}</p>
            ) : view.list.products.length === 0 ? (
              <div className={styles.empty}>
                <p className={styles.emptyText}>{texts.empty}</p>
                {category && (
                  <Link href={categoryHref(category.Slug)} className={styles.emptyLink}>
                    {texts.allCategory(category.Name)}
                  </Link>
                )}
              </div>
            ) : (
              <div className={styles.grid}>
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
};
