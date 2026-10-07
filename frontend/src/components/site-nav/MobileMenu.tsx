'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavItem } from './nav-menu';
import { texts } from './site-nav-texts';

const HAMBURGER = (
  <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" fill="none" aria-hidden>
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/** Hamburger + slide-in accordion panel, shown at 860px and below. */
export function MobileMenu({ items }: { items: NavItem[] }) {
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
        aria-controls="mobile-menu"
        onClick={() => (open ? close() : setOpen(true))}
        className="flex p-1.5 text-ink min-[861px]:hidden"
      >
        {HAMBURGER}
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label={texts.mobileNavLabel}
          className="fixed inset-x-0 bottom-0 top-16 z-[49] flex flex-col overflow-y-auto bg-ink px-6 pb-6 pt-2 min-[861px]:hidden"
        >
          {items.map((item) => (
            <div key={item.href} className="border-b border-white/15 py-1">
              <div className="flex items-center justify-between gap-3">
                <Link
                  href={item.href}
                  onClick={close}
                  className="flex-1 py-3.5 text-base font-semibold uppercase tracking-[0.04em] text-white"
                >
                  {item.label}
                </Link>
                <button
                  type="button"
                  aria-expanded={expanded.has(item.href)}
                  aria-label={texts.toggleSubmenu(item.label)}
                  onClick={() => toggleGroup(item.href)}
                  className="flex items-center px-1 py-3.5 text-white"
                >
                  <span
                    aria-hidden
                    className={`inline-block text-xl leading-none transition-transform duration-200 ${
                      expanded.has(item.href) ? 'rotate-90' : ''
                    }`}
                  >
                    &rsaquo;
                  </span>
                </button>
              </div>
              {expanded.has(item.href) && (
                <div className="flex flex-col pb-3.5 pl-3.5">
                  {item.columns.map((column, index) => (
                    <div key={column.head?.href ?? column.allLink?.href ?? index} className="flex flex-col">
                      {column.head && (
                        <Link
                          href={column.head.href}
                          onClick={close}
                          className="mb-0.5 mt-2.5 font-mono text-[11px] uppercase tracking-[0.1em] text-white opacity-[.55] first:mt-1"
                        >
                          {column.head.label}
                        </Link>
                      )}
                      {[...(column.allLink ? [column.allLink] : []), ...column.links].map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={close}
                          className="py-[9px] text-sm font-medium text-white opacity-[.85]"
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
}
