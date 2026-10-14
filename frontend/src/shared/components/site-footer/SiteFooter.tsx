import Link from 'next/link';
import { getFooter, type FooterLink } from '@/lib/strapi/footer';
import { styles } from './site-footer.styles';
import { texts } from './site-footer-texts';

/** Storefront paths go through next/link; http(s) URLs are plain anchors. Both are vetted by getFooter. */
const linkTo = ({ label, href, external }: FooterLink, className: string) =>
  external ? (
    <a href={href} className={className}>
      {label}
    </a>
  ) : (
    <Link href={href} className={className}>
      {label}
    </Link>
  );

/**
 * The site footer on every page (design index.html `footer`), from the Strapi `footer` single
 * type. Without one (not seeded, or Strapi down) it falls back to the wordmark and copyright.
 */
export const SiteFooter = async (): Promise<React.JSX.Element> => {
  const footer = await getFooter();
  const copyright = footer?.copyright || texts.copyright;

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        {footer ? (
          <>
            <div className={styles.grid}>
              <div>
                <p className={styles.wordmark}>{texts.wordmark}</p>
                {footer.tagline && <p className={styles.tagline}>{footer.tagline}</p>}
              </div>
              {footer.columns.map((column) => (
                <div key={column.title}>
                  <h2 className={styles.columnTitle}>{column.title}</h2>
                  <ul className={styles.list}>
                    {column.links.map((link) => (
                      <li key={`${link.label}-${link.href}`}>{linkTo(link, styles.link)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className={styles.bottom}>
              <span>{copyright}</span>
              {footer.legalLinks.length > 0 && (
                <ul aria-label={texts.legalLabel} className={styles.legal}>
                  {footer.legalLinks.map((link) => (
                    <li key={`${link.label}-${link.href}`}>{linkTo(link, styles.legalLink)}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <div className={styles.fallback}>
            <span className={styles.fallbackWordmark}>{texts.wordmark}</span>
            <span>{copyright}</span>
          </div>
        )}
      </div>
    </footer>
  );
};
