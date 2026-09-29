'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react';
import type { NavItem } from './nav-menu';
import { texts } from './site-nav-texts';

const CLOSE_DELAY_MS = 250;

export function DesktopMenu({ items }: { items: NavItem[] }) {
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);
  const [focusedHref, setFocusedHref] = useState<string | null>(null);
  const [dismissedHref, setDismissedHref] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const topLinks = useRef(new Map<string, HTMLAnchorElement>());

  const pathname = usePathname();

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  // Safety net: the header doesn't remount on client-side navigation, so close whatever is open when the route changes.
  useEffect(() => {
    clearTimeout(closeTimer.current);
    setHoveredHref(null);
    setFocusedHref(null);
  }, [pathname]);

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

  function handleFocus(href: string, e: FocusEvent<HTMLLIElement>) {
    setFocusedHref(href);
    // Focus arriving from outside the item lifts an earlier dismissal (Escape moves focus within the item, so it holds).
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDismissedHref((current) => (current === href ? null : current));
    }
  }

  function handleBlur(href: string, e: FocusEvent<HTMLLIElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setFocusedHref((current) => (current === href ? null : current));
      setDismissedHref((current) => (current === href ? null : current));
    }
  }

  // Any link click closes the menu: the clicked link would otherwise keep focus (and the panel open) after navigating.
  function handleClick(href: string, e: MouseEvent<HTMLLIElement>) {
    const link = (e.target as Element).closest('a');
    if (!link) return;
    link.blur();
    clearTimeout(closeTimer.current);
    setHoveredHref(null);
    setFocusedHref(null);
    setDismissedHref(href);
  }

  function handleKeyDown(href: string, e: KeyboardEvent<HTMLLIElement>) {
    if (e.key === 'Escape' && openItem === href) {
      setDismissedHref(href);
      topLinks.current.get(href)?.focus();
    }
  }

  return (
    <nav aria-label={texts.mainNavLabel} className="hidden min-[861px]:block">
      <ul className="m-0 flex list-none gap-7 p-0">
        {items.map((item) => (
          <li
            key={item.href}
            onMouseEnter={() => handleMouseEnter(item.href)}
            onMouseLeave={() => handleMouseLeave(item.href)}
            onFocus={(e) => handleFocus(item.href, e)}
            onBlur={(e) => handleBlur(item.href, e)}
            onKeyDown={(e) => handleKeyDown(item.href, e)}
            onClick={(e) => handleClick(item.href, e)}
          >
            <Link
              ref={(el) => {
                if (el) topLinks.current.set(item.href, el);
                else topLinks.current.delete(item.href);
              }}
              href={item.href}
              data-nav-top=""
              className="text-[13.5px] font-semibold uppercase tracking-[0.04em] text-ink opacity-[.92] hover:text-horizon"
            >
              {item.label}
            </Link>
            <div
              data-mega-panel=""
              data-open={openItem === item.href ? 'true' : 'false'}
              className={`absolute inset-x-0 top-full z-[60] border-t border-border bg-white shadow-[0_20px_40px_rgba(18,33,42,.14)] ${
                openItem === item.href ? 'block' : 'hidden'
              }`}
            >
              <div className="mx-auto flex max-w-[1240px] gap-14 px-6 pb-10 pt-9">
                {item.columns.map((column, index) => (
                  <div key={column.head?.href ?? column.allLink?.href ?? index} className="flex min-w-[180px] flex-col gap-0.5">
                    {column.head && (
                      <Link
                        href={column.head.href}
                        className="mb-1 font-mono text-[11px] uppercase tracking-[0.1em] text-muted hover:text-horizon"
                      >
                        {column.head.label}
                      </Link>
                    )}
                    {column.allLink && (
                      <Link
                        href={column.allLink.href}
                        className="mb-1.5 border-b border-border pb-3 pt-[7px] text-[14.5px] font-bold text-ink hover:text-horizon"
                      >
                        {column.allLink.label}
                      </Link>
                    )}
                    {column.links.map((link) => (
                      <Link key={link.href} href={link.href} className="py-[7px] text-[14.5px] font-medium text-ink hover:text-horizon">
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
}
