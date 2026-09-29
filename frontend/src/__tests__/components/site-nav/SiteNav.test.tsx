import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrapiNavCategory } from '@/lib/strapi/navigation';

const mockGetSession = vi.fn();
const mockGetNavigationCategories = vi.fn();

vi.mock('@/lib/auth/session', () => ({ getSession: () => mockGetSession() }));
vi.mock('@/lib/strapi/navigation', () => ({ getNavigationCategories: () => mockGetNavigationCategories() }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

import { SiteNav } from '@/components/site-nav';

function cat(Slug: string, Name: string, subs: [string, string, string?][]): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n, l]) => ({ Slug: s, Name: n, NavLabel: l ?? null })) };
}

const CATEGORIES = [
  cat('surfboards', 'Surfboards', [['longboard', 'Longboard'], ['soft-top-beginner', 'Soft-top / Beginner']]),
  cat('wetsuits', 'Wetsuits', [['mens-wetsuits', "Men's Wetsuits", 'Men']]),
  cat('mens-clothing', "Men's Clothing", [['mens-shorts', "Men's Shorts", 'Shorts']]),
  cat('womens-clothing', "Women's Clothing", [['womens-tops', "Women's Tops", 'Tops']]),
];

async function renderNav({ loggedIn = false, categories = CATEGORIES } = {}) {
  mockGetSession.mockReturnValue(loggedIn ? { jwt: 'a.jwt' } : null);
  mockGetNavigationCategories.mockResolvedValue(categories);
  return render(await SiteNav());
}

function desktop() {
  return screen.getByRole('navigation', { name: 'Main' });
}

function desktopItem(label: string) {
  return within(desktop()).getByRole('link', { name: label }).closest('li')!;
}

function panelOf(label: string) {
  return desktopItem(label).querySelector<HTMLElement>('[data-mega-panel]')!;
}

describe('SiteNav', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders the wordmark linking home and the Strapi menu items in order (AC1, AC2, AC10)', async () => {
    await renderNav();

    expect(screen.getByRole('link', { name: 'WESTLINE' })).toHaveAttribute('href', '/');
    const top = within(desktop())
      .getAllByRole('link')
      .filter((a) => a.dataset.navTop !== undefined);
    expect(top.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Surfboards', '/products/category/surfboards'],
      ['Wetsuits', '/products/category/wetsuits'],
      ['Clothing', '/products/category/clothing'],
    ]);
  });

  it('renders each mega-menu server-side: "All <Category>" then subcategories, Clothing as Men/Women columns (AC3, AC4, AC5)', async () => {
    await renderNav();

    const surf = within(panelOf('Surfboards'));
    expect(surf.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['All Surfboards', '/products/category/surfboards'],
      ['Longboard', '/products/category/surfboards?sub=longboard'],
      ['Soft-top / Beginner', '/products/category/surfboards?sub=soft-top-beginner'],
    ]);

    expect(within(panelOf('Wetsuits')).getByRole('link', { name: 'Men' })).toHaveAttribute(
      'href',
      '/products/category/wetsuits?sub=mens-wetsuits'
    );

    const clothing = within(panelOf('Clothing'));
    expect(clothing.getAllByRole('link').map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Men', '/products/category/mens-clothing'],
      ['Shorts', '/products/category/mens-clothing?sub=mens-shorts'],
      ['Women', '/products/category/womens-clothing'],
      ['Tops', '/products/category/womens-clothing?sub=womens-tops'],
    ]);
  });

  it('opens a mega-menu on hover and closes it 250ms after the pointer leaves (AC6)', async () => {
    await renderNav();
    const item = desktopItem('Surfboards');
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');

    fireEvent.mouseEnter(item);
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');

    fireEvent.mouseLeave(item);
    act(() => vi.advanceTimersByTime(249));
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');
    act(() => vi.advanceTimersByTime(1));
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
  });

  it('keeps the menu open when the pointer comes back within 250ms (AC6)', async () => {
    await renderNav();
    const item = desktopItem('Surfboards');

    fireEvent.mouseEnter(item);
    fireEvent.mouseLeave(item);
    act(() => vi.advanceTimersByTime(200));
    fireEvent.mouseEnter(item);
    act(() => vi.advanceTimersByTime(500));

    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');
  });

  it('shows one mega-menu at a time: moving to another item switches over immediately (AC6)', async () => {
    await renderNav();

    fireEvent.mouseEnter(desktopItem('Surfboards'));
    fireEvent.mouseLeave(desktopItem('Surfboards'));
    fireEvent.mouseEnter(desktopItem('Wetsuits'));

    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'true');
    act(() => vi.advanceTimersByTime(500));
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'true');
  });

  it('keeps a focused item open after the pointer leaves (AC6)', async () => {
    await renderNav();
    const item = desktopItem('Surfboards');

    fireEvent.focus(within(desktop()).getByRole('link', { name: 'Surfboards' }));
    fireEvent.mouseEnter(item);
    fireEvent.mouseLeave(item);
    act(() => vi.advanceTimersByTime(500));

    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');
  });

  it('opens on keyboard focus within the item and closes when focus leaves it (AC6)', async () => {
    await renderNav();
    const top = within(desktop()).getByRole('link', { name: 'Surfboards' });

    fireEvent.focus(top);
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');

    fireEvent.blur(top, { relatedTarget: within(desktop()).getByRole('link', { name: 'Wetsuits' }) });
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
  });

  it('closes on Escape and returns focus to the top-level link (AC6)', async () => {
    await renderNav();
    const top = within(desktop()).getByRole('link', { name: 'Surfboards' });
    const inner = within(panelOf('Surfboards')).getByRole('link', { name: 'Longboard' });

    fireEvent.focus(top);
    inner.focus();
    fireEvent.keyDown(inner, { key: 'Escape' });

    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
    expect(top).toHaveFocus();
  });

  it('toggles the mobile panel with the hamburger (AC7)', async () => {
    await renderNav();
    const burger = screen.getByRole('button', { name: 'Menu' });
    expect(burger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();

    fireEvent.click(burger);
    expect(burger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Mobile' })).toBeInTheDocument();

    fireEvent.click(burger);
    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
  });

  it('expands each mobile group as an accordion, Clothing under Men/Women heads (AC7)', async () => {
    await renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const mobile = within(screen.getByRole('navigation', { name: 'Mobile' }));

    const toggle = mobile.getByRole('button', { name: 'Toggle Clothing submenu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(mobile.queryByRole('link', { name: 'Shorts' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(mobile.getByRole('link', { name: 'Men' })).toHaveAttribute('href', '/products/category/mens-clothing');
    expect(mobile.getByRole('link', { name: 'Shorts' })).toHaveAttribute('href', '/products/category/mens-clothing?sub=mens-shorts');
    expect(mobile.getByRole('link', { name: 'Tops' })).toBeInTheDocument();
    expect(mobile.getByRole('button', { name: 'Toggle Surfboards submenu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('starts every accordion collapsed each time the mobile panel opens (AC7)', async () => {
    await renderNav();
    const burger = screen.getByRole('button', { name: 'Menu' });

    fireEvent.click(burger);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle Clothing submenu' }));
    fireEvent.click(burger);
    fireEvent.click(burger);

    expect(screen.getByRole('button', { name: 'Toggle Clothing submenu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the mobile panel when a link in it is tapped (AC7)', async () => {
    await renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    fireEvent.click(within(screen.getByRole('navigation', { name: 'Mobile' })).getByRole('link', { name: 'Wetsuits' }));

    expect(screen.queryByRole('navigation', { name: 'Mobile' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows Sign In when logged out and Log Out when logged in, plus Wishlist and Cart links (AC8)', async () => {
    const { unmount } = await renderNav();
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: 'Wishlist' })).toHaveAttribute('href', '/account#wishlist');
    expect(screen.getByRole('link', { name: 'Cart' })).toHaveAttribute('href', '/cart');
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    unmount();

    await renderNav({ loggedIn: true });
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('renders no search, cart count or Surfboard Finder link/promo (AC9)', async () => {
    const { container } = await renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/finder/i)).not.toBeInTheDocument();
    expect(within(screen.getByRole('link', { name: 'Cart' })).queryByText(/^\d+$/)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Not sure where to start/i);
  });

  it('still renders the header, wordmark and icons with no menu when Strapi returns nothing (AC11)', async () => {
    await renderNav({ categories: [] });

    expect(screen.getByRole('link', { name: 'WESTLINE' })).toBeInTheDocument();
    expect(within(desktop()).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('link', { name: 'Cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
