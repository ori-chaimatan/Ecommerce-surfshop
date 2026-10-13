import Link from 'next/link';
import { Icon } from '@/shared/components/icons';
import { styles } from './catalog-pagination.styles';
import type { ICatalogPaginationProps } from './catalog.types';
import { texts } from './catalog-texts';

export const CatalogPagination = ({ pagination: { prevHref, nextHref, pages } }: ICatalogPaginationProps): React.JSX.Element => {
  return (
    <nav aria-label={texts.paginationLabel} className={styles.nav}>
      {prevHref && (
        <Link href={prevHref} aria-label={texts.previousPage} className={styles.pageLink.idle}>
          <Icon name="arrow-left" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
        </Link>
      )}
      {pages.map((page) => (
        <Link
          key={page.number}
          href={page.href}
          aria-label={texts.pageLabel(page.number)}
          aria-current={page.current ? 'page' : undefined}
          className={styles.pageLink[page.current ? 'current' : 'idle']}
        >
          {page.number}
        </Link>
      ))}
      {nextHref && (
        <Link href={nextHref} aria-label={texts.nextPage} className={styles.pageLink.idle}>
          <Icon name="arrow-right" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" />
        </Link>
      )}
    </nav>
  );
};
