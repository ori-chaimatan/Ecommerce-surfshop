'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/shared/components/icons';
import type { SidebarGroup } from './catalog';
import { texts } from './catalog-texts';

function linkClass(active: boolean, indent: string) {
  return `block border-l-2 py-1.5 ${indent} ${
    active ? 'border-horizon font-semibold text-horizon' : 'border-transparent text-muted hover:text-ink'
  }`;
}

interface CatalogSidebarProps {
  groups: SidebarGroup[];
}

export function CatalogSidebar({ groups }: CatalogSidebarProps) {
  const [openKeys, setOpenKeys] = useState(
    () => new Set(groups.flatMap((g) => [g, ...g.subgroups]).filter((g) => g.open).map((g) => g.key))
  );

  const toggle = (key: string) =>
    setOpenKeys((current) => {
      const next = new Set(current);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  return (
    <aside className="max-[900px]:hidden">
      <h2 className="mb-3.5 font-mono text-xs uppercase tracking-[0.08em] text-muted">{texts.categories}</h2>
      <ul>
        {groups.map((group) => {
          const open = openKeys.has(group.key);
          return (
            <li key={group.key} className="mb-0.5">
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(group.key)}
                className={`flex w-full items-center justify-between py-2.5 text-left text-[14.5px] font-bold ${open ? 'text-horizon' : 'text-ink'}`}
              >
                {group.label}
                <Icon
                  name="chevron-down"
                  className={`h-3.5 w-3.5 fill-none stroke-muted stroke-2 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && (
                <ul className="mb-2.5 pl-0.5">
                  {group.links.map((link) => (
                    <li key={link.href} className="mb-0.5">
                      <Link href={link.href} aria-current={link.active ? 'page' : undefined} className={`${linkClass(link.active, 'pl-3.5')} text-[13.5px]`}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {group.subgroups.map((subgroup) => {
                    const subOpen = openKeys.has(subgroup.key);
                    return (
                      <li key={subgroup.key} className="mb-0.5">
                        <button
                          type="button"
                          aria-expanded={subOpen}
                          onClick={() => toggle(subgroup.key)}
                          className={`flex w-full items-center justify-between py-1.5 pl-3.5 text-left text-[13.5px] font-bold ${subOpen ? 'text-horizon' : 'text-ink'}`}
                        >
                          {subgroup.label}
                          <Icon
                            name="chevron-down"
                            className={`h-3 w-3 shrink-0 fill-none stroke-muted stroke-2 transition-transform duration-200 ${subOpen ? 'rotate-180' : ''}`}
                          />
                        </button>
                        {subOpen && (
                          <ul className="mb-1.5">
                            {subgroup.links.map((link) => (
                              <li key={link.href} className="mb-0.5">
                                <Link href={link.href} aria-current={link.active ? 'page' : undefined} className={`${linkClass(link.active, 'pl-7')} text-[13px]`}>
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
