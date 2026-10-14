import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CatalogSidebar } from '@/components/catalog/CatalogSidebar';
import type { SidebarGroup } from '@/components/catalog/catalog';

const GROUPS: SidebarGroup[] = [
  {
    key: '/products/category/surfboards',
    label: 'Surfboards',
    open: true,
    links: [
      { label: 'All Surfboards', href: '/products/category/surfboards', active: true },
      { label: 'Longboard', href: '/products/category/surfboards?sub=longboard', active: false },
    ],
    subgroups: [],
  },
  {
    key: '/products/category/clothing',
    label: 'Clothing',
    open: false,
    links: [{ label: 'Shop All Clothing', href: '/products/category/clothing', active: false }],
    subgroups: [
      {
        key: '/products/category/clothing?gender=men',
        label: 'Men',
        open: false,
        links: [
          { label: 'All Men', href: '/products/category/clothing?gender=men', active: false },
          { label: 'Shorts', href: '/products/category/clothing?sub=shorts&gender=men', active: false },
        ],
      },
    ],
  },
];

describe('CatalogSidebar (AC8)', () => {
  it('starts with the model open state and marks the active link', () => {
    render(<CatalogSidebar groups={GROUPS} />);

    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Surfboards' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Clothing' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('link', { name: 'All Surfboards' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Longboard' })).not.toHaveAttribute('aria-current');
    expect(screen.queryByRole('link', { name: 'Shop All Clothing' })).toBeNull();
  });

  it('toggles groups and gender subgroups independently', () => {
    render(<CatalogSidebar groups={GROUPS} />);

    fireEvent.click(screen.getByRole('button', { name: 'Clothing' }));
    expect(screen.getByRole('button', { name: 'Clothing' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: 'Surfboards' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Shop All Clothing' })).toHaveAttribute('href', '/products/category/clothing');
    expect(screen.queryByRole('link', { name: 'All Men' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Men' }));
    expect(screen.getByRole('button', { name: 'Men' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'All Men' })).toHaveAttribute('href', '/products/category/clothing?gender=men');

    fireEvent.click(screen.getByRole('button', { name: 'Surfboards' }));
    expect(screen.getByRole('button', { name: 'Surfboards' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: 'Longboard' })).toBeNull();
  });
});
