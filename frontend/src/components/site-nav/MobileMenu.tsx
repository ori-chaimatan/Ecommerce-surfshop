'use client';

import Link from 'next/link';
import { useState } from 'react';
import { styles } from './mobile-menu.styles';
import type { IMobileMenuProps } from './site-nav.types';
import { texts } from './site-nav-texts';

const HAMBURGER = (
  <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/** Hamburger + slide-in accordion panel, shown at 860px and below. */
export const MobileMenu = ({ items }: IMobileMenuProps): React.JSX.Element => {
  const [open, setOpen] = useState(false);
  // Hrefs of the expanded accordion groups; cleared whenever the panel closes.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function close() {
    setOpen(false);
    setExpanded(new Set());
  }

  function toggleGroup(href: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }

  return (
    <>
      <button
        type="button"
        aria-label={texts.menuButtonLabel}
        aria-expanded={open}
        // Points at the panel only while it's rendered.
        aria-controls={open ? 'mobile-menu' : undefined}
        onClick={() => (open ? close() : setOpen(true))}
        className={styles.burger}
      >
        {HAMBURGER}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={texts.mobileNavLabel}
          className={styles.panel}
        >
          {items.map((item) => (
            <div key={item.href} className={styles.item}>
              <div className={styles.itemRow}>
                <Link
                  href={item.href}
                  onClick={close}
                  className={styles.itemLink}
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-expanded={expanded.has(item.href)}
                  aria-label={texts.toggleSubmenu(item.label)}
                  onClick={() => toggleGroup(item.href)}
                  className={styles.toggle}
                >
                  <span
                    aria-hidden
                    className={`${styles.chevron.base} ${styles.chevron.state[expanded.has(item.href) ? 'expanded' : 'collapsed']}`}
                  >
                    &rsaquo;
                  </span>
                </button>
              </div>
              {expanded.has(item.href) && (
                <div className={styles.group}>
                  {item.columns.map((column, index) => (
                    <div key={column.head?.href ?? column.allLink?.href ?? index} className={styles.column}>
                      {column.head && (
                        <Link
                          href={column.head.href}
                          onClick={close}
                          className={styles.columnHead}
                        >
                          {column.head.label}
                        </Link>
                      )}
                      {[...(column.allLink ? [column.allLink] : []), ...column.links].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={close}
                          className={styles.link}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      )}
    </>
  );
};
