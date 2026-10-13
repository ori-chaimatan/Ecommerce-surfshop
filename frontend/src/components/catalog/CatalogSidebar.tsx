'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Icon } from '@/shared/components/icons';
import { styles } from './catalog-sidebar.styles';
import type { ICatalogSidebarProps } from './catalog.types';
import { texts } from './catalog-texts';

const linkClass = (active: boolean, level: 'group' | 'subgroup') =>
  `${styles.link.base} ${styles.link.indent[level]} ${styles.link.state[active ? 'active' : 'idle']} ${styles.link.size[level]}`;

export const CatalogSidebar = ({ groups }: ICatalogSidebarProps): React.JSX.Element => {
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
    <aside className={styles.aside}>
      <h2 className={styles.heading}>{texts.categories}</h2>
      <ul>
        {groups.map((group) => {
          const open = openKeys.has(group.key);
          return (
            <li key={group.key} className={styles.item}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => toggle(group.key)}
                className={`${styles.groupToggle.base} ${styles.groupToggle.state[open ? 'open' : 'closed']}`}
              >
                {group.label}
                <Icon
                  name="chevron-down"
                  className={`${styles.groupChevron.base} ${styles.groupChevron.state[open ? 'open' : 'closed']}`}
                />
              </button>
              {open && (
                <ul className={styles.groupList}>
                  {group.links.map((link) => (
                    <li key={link.href} className={styles.item}>
                      <Link href={link.href} aria-current={link.active ? 'page' : undefined} className={linkClass(link.active, 'group')}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                  {group.subgroups.map((subgroup) => {
                    const subOpen = openKeys.has(subgroup.key);
                    return (
                      <li key={subgroup.key} className={styles.item}>
                        <button
                          type="button"
                          aria-expanded={subOpen}
                          onClick={() => toggle(subgroup.key)}
                          className={`${styles.subgroupToggle.base} ${styles.subgroupToggle.state[subOpen ? 'open' : 'closed']}`}
                        >
                          {subgroup.label}
                          <Icon
                            name="chevron-down"
                            className={`${styles.subgroupChevron.base} ${styles.subgroupChevron.state[subOpen ? 'open' : 'closed']}`}
                          />
                        </button>
                        {subOpen && (
                          <ul className={styles.subgroupList}>
                            {subgroup.links.map((link) => (
                              <li key={link.href} className={styles.item}>
                                <Link href={link.href} aria-current={link.active ? 'page' : undefined} className={linkClass(link.active, 'subgroup')}>
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
};
