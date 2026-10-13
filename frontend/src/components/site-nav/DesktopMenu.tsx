'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import { styles } from './desktop-menu.styles';
import type { IDesktopMenuProps } from './site-nav.types';
import { texts } from './site-nav-texts';

const CLOSE_DELAY_MS = 250;

export const DesktopMenu = ({ items }: IDesktopMenuProps): React.JSX.Element => {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [focusedHref, setFocusedHref] = useState<string | null>(null);
  const [dismissedHref, setDismissedHref] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const topLinks = useRef(new Map<string, HTMLAnchorElement>());

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const openItem = [hoveredHref, focusedHref].find((href) => href !== null && href !== dismissedHref) ?? null;

  function handleMouseEnter(href: string) {
    clearTimeout(closeTimer.current);
    setHoveredHref(href);
    setDismissedHref(null);
  }

  function handleMouseLeave(href: string) {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setHoveredHref((current) => (current === href ? null : current)), CLOSE_DELAY_MS);
  }

  function handleBlur(href: string, e: FocusEvent<HTMLLIElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusedHref((current) => (current === href ? null : current));
      setDismissedHref((current) => (current === href ? null : current));
    }
  }

  // The header outlives client navigation, and a clicked link keeps focus, so a followed link
  // would leave its mega-menu open over the new page. Any link click closes the menu.
  function handleClick(e: MouseEvent<HTMLLIElement>) {
    if (!(e.target as Element).closest('a')) return;
    clearTimeout(closeTimer.current);
    setHoveredHref(null);
    setFocusedHref(null);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  function handleKeyDown(href: string, e: KeyboardEvent<HTMLLIElement>) {
    if (e.key === 'Escape' && openItem === href) {
      setDismissedHref(href);
      topLinks.current.get(href)?.focus();
    }
  }

  return (
    <nav aria-label={texts.mainNavLabel} className={styles.nav}>
      <ul className={styles.list}>
        {items.map((item) => (
          <li
            key={item.href}
            onMouseEnter={() => handleMouseEnter(item.href)}
            onMouseLeave={() => handleMouseLeave(item.href)}
            onFocus={() => setFocusedHref(item.href)}
            onBlur={(e) => handleBlur(item.href, e)}
            onKeyDown={(e) => handleKeyDown(item.href, e)}
            onClick={handleClick}
          >
            <Link
              ref={(el) => {
                if (el) topLinks.current.set(item.href, el);
                else topLinks.current.delete(item.href);
              }}
              href={item.href}
              data-nav-top=""
              className={styles.topLink}
            >
              {item.label}
            </Link>
            <div
              data-mega-panel=""
              data-open={openItem === item.href ? 'true' : 'false'}
              className={`${styles.panel.base} ${styles.panel.state[openItem === item.href ? 'open' : 'closed']}`}
            >
              <div className={styles.panelInner}>
                {item.columns.map((column, index) => (
                  <div key={column.head?.href ?? column.allLink?.href ?? index} className={styles.column}>
                    {column.head && (
                      <Link href={column.head.href} className={styles.columnHead}>
                        {column.head.label}
                      </Link>
                    )}
                    {column.allLink && (
                      <Link href={column.allLink.href} className={styles.allLink}>
                        {column.allLink.label}
                      </Link>
                    )}
                    {column.links.map((link) => (
                      <Link key={link.href} href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </nav>
  );
};
