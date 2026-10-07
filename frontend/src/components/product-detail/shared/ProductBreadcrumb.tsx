import Link from 'next/link';
import { Fragment } from 'react';
import { texts } from '../product-detail-texts';
import type { BreadcrumbItem } from './breadcrumb';
import { CONTAINER } from './layout';

interface ProductBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function ProductBreadcrumb({ items }: ProductBreadcrumbProps) {
  return (
    <div className={CONTAINER}>
      <nav
        aria-label={texts.breadcrumbLabel}
        className="flex flex-wrap items-center gap-2 py-5 font-mono text-xs uppercase tracking-[0.04em] text-muted"
      >
        {items.map((item, index) => (
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
    </div>
  );
}
