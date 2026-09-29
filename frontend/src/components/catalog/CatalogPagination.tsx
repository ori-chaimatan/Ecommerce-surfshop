import Link from 'next/link';
import { Icon } from '@/shared/components/icons';
import type { Pagination } from './catalog';
import { texts } from './catalog-texts';

const BOX = 'flex h-9 min-w-9 items-center justify-center rounded-[9px] border px-2 text-[13px] font-semibold';
const IDLE = `${BOX} border-border bg-white text-ink hover:border-ink`;
const CURRENT = `${BOX} border-ink bg-ink text-white`;

interface CatalogPaginationProps {
  pagination: Pagination;
}

export function CatalogPagination({ pagination: { prevHref, nextHref, pages } }: CatalogPaginationProps) {
  return (
    <nav aria-label={texts.paginationLabel} className="mt-12 flex items-center justify-center gap-2">
      {prevHref && (
        <Link href={prevHref} aria-label={texts.previousPage} className={IDLE}>
          <Icon name="arrow-left" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page.number}
          href={page.href}
          aria-label={texts.pageLabel(page.number)}
          aria-current={page.current ? 'page' : undefined}
          className={page.current ? CURRENT : IDLE}
        >
          {page.number}
        </Link>
      ))}
      {nextHref && (
        <Link href={nextHref} aria-label={texts.nextPage} className={IDLE}>
          <Icon name="arrow-right" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
        </Link>
      )}
    </nav>
  );
}
