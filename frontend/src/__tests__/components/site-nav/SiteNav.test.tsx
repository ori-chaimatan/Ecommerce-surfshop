import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { StrapiNavCategory, SubcategoryGenders } from '@/lib/strapi/navigation';
import { CartContext } from '@/components/cart/cart-context';
import { cartContext, makeCart } from '../cart/cart-test-utils';

const mockGetSession = vi.fn();
const mockGetNavigation = vi.fn();

vi.mock('@/lib/auth/session', () => ({ getSession: () => mockGetSession() }));
vi.mock('@/lib/strapi/navigation', () => ({ getNavigation: () => mockGetNavigation() }));
const mockPathname = vi.fn(() => '/');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  usePathname: () => mockPathname(),
}));

import { SiteNav } from '@/components/site-nav';

function cat(Slug: string, Name: string, subs: [string, string, string?][]): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n, l]) => ({ Slug: s, Name: n, NavLabel: l ?? null })) };
}

const CATEGORIES = [
  cat('surfboards', 'Surfboards', [['longboard', 'Longboard'], ['soft-top-beginner', 'Soft-top / Beginner']]),
  cat('wetsuits', 'Wetsuits', [['mens-wetsuits', "Men's Wetsuits", 'Men']]),
  cat('clothing', 'Clothing', [['tshirts-tanks', 'T-Shirts & Tanks'], ['shorts', 'Shorts'], ['tops', 'Tops']]),
];

const SUBCATEGORY_GENDERS: SubcategoryGenders = { 'tshirts-tanks': ['Unisex'], shorts: ['Men'], tops: ['Women'] };

async function renderNav({ loggedIn = false, categories = CATEGORIES, subcategoryGenders = SUBCATEGORY_GENDERS as SubcategoryGenders | null } = {}) {
  mockGetSession.mockReturnValue(loggedIn ? { jwt: 'a.jwt' } : null);
  mockGetNavigation.mockResolvedValue({ categories, subcategoryGenders });
  const cart = cartContext({ cart: makeCart([]) });
  return render(await SiteNav(), {
    wrapper: ({ children }) => <CartContext.Provider value={cart}>{children}</CartContext.Provider>,
  });
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
    mockPathname.mockReturnValue('/');
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

  it('renders each mega-menu server-side: "All <Category>" then subcategories, Clothing as Men / Women columns (AC3, AC4, AC5)', async () => {
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
      ['Men', '/products/category/clothing?gender=men'],
      ['T-Shirts & Tanks', '/products/category/clothing?sub=tshirts-tanks&gender=men'],
      ['Shorts', '/products/category/clothing?sub=shorts&gender=men'],
      ['Women', '/products/category/clothing?gender=women'],
      ['T-Shirts & Tanks', '/products/category/clothing?sub=tshirts-tanks&gender=women'],
      ['Tops', '/products/category/clothing?sub=tops&gender=women'],
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

  it('closes the mega-menu when a link inside it is clicked; hovering or focusing again reopens it (AC6)', async () => {
    await renderNav();
    const item = desktopItem('Wetsuits');
    const inner = within(panelOf('Wetsuits')).getByRole('link', { name: 'Men' });

    fireEvent.mouseEnter(item);
    inner.focus();
    fireEvent.click(inner);

    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'false');
    expect(inner).not.toHaveFocus();
    act(() => vi.advanceTimersByTime(500));
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'false');

    fireEvent.mouseLeave(item);
    fireEvent.mouseEnter(item);
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'true');

    fireEvent.click(within(panelOf('Wetsuits')).getByRole('link', { name: 'All Wetsuits' }));
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'false');
    fireEvent.focus(within(desktop()).getByRole('link', { name: 'Wetsuits' }));
    expect(panelOf('Wetsuits')).toHaveAttribute('data-open', 'true');
  });

  it('closes the mega-menu when its top-level link or a column head is clicked (AC6)', async () => {
    await renderNav();
    const top = within(desktop()).getByRole('link', { name: 'Surfboards' });

    fireEvent.mouseEnter(desktopItem('Surfboards'));
    top.focus();
    fireEvent.click(top);
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
    expect(top).not.toHaveFocus();

    fireEvent.mouseEnter(desktopItem('Clothing'));
    fireEvent.click(within(panelOf('Clothing')).getByRole('link', { name: 'Women' }));
    expect(panelOf('Clothing')).toHaveAttribute('data-open', 'false');
  });

  it('closes an open mega-menu when the pathname changes (AC6)', async () => {
    const { rerender } = await renderNav();

    fireEvent.focus(within(desktop()).getByRole('link', { name: 'Surfboards' }));
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'true');

    mockPathname.mockReturnValue('/products/category/surfboards');
    rerender(await SiteNav());
    expect(panelOf('Surfboards')).toHaveAttribute('data-open', 'false');
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

  it('expands each mobile group as an accordion, Clothing under Men / Women heads (AC7)', async () => {
    await renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));
    const mobile = within(screen.getByRole('navigation', { name: 'Mobile' }));

    const toggle = mobile.getByRole('button', { name: 'Toggle Clothing submenu' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(mobile.queryByRole('link', { name: 'Shorts' })).not.toBeInTheDocument();

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const heads = mobile.getAllByRole('link').filter((a) => ['Men', 'Women'].includes(a.textContent ?? ''));
    expect(heads.map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['Men', '/products/category/clothing?gender=men'],
      ['Women', '/products/category/clothing?gender=women'],
    ]);
    expect(mobile.getByRole('link', { name: 'Shorts' })).toHaveAttribute('href', '/products/category/clothing?sub=shorts&gender=men');
    expect(mobile.getByRole('link', { name: 'Tops' })).toHaveAttribute('href', '/products/category/clothing?sub=tops&gender=women');
    expect(mobile.getAllByRole('link', { name: 'T-Shirts & Tanks' })).toHaveLength(2);
    expect(mobile.queryByRole('link', { name: /^Shop / })).not.toBeInTheDocument();
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

  it('shows Sign In when logged out and Log Out when logged in, plus the Wishlist link and the Cart button (AC8; cart button per add-to-cart AC10)', async () => {
    const { unmount } = await renderNav();
    expect(screen.getByRole('link', { name: 'Account' })).toHaveAttribute('href', '/auth/login');
    expect(screen.getByRole('link', { name: 'Wishlist' })).toHaveAttribute('href', '/account#wishlist');
    expect(screen.getByRole('button', { name: 'Cart' })).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('button', { name: 'Log out' })).not.toBeInTheDocument();
    unmount();

    await renderNav({ loggedIn: true });
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Account' })).not.toBeInTheDocument();
  });

  it('renders no search or Surfboard Finder link/promo, and no cart count for an empty cart (AC9; count per add-to-cart AC10)', async () => {
    const { container } = await renderNav();
    fireEvent.click(screen.getByRole('button', { name: 'Menu' }));

    expect(screen.queryByRole('button', { name: /search/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/finder/i)).not.toBeInTheDocument();
    expect(within(screen.getByRole('button', { name: 'Cart' })).queryByText(/^\d+$/)).not.toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Not sure where to start/i);
  });

  it('falls back to every Clothing subcategory under both heads when gender data is unavailable (AC3, AC11)', async () => {
    await renderNav({ subcategoryGenders: null });

    const labels = within(panelOf('Clothing')).getAllByRole('link').map((a) => a.textContent);
    expect(labels).toEqual(['Men', 'T-Shirts & Tanks', 'Shorts', 'Tops', 'Women', 'T-Shirts & Tanks', 'Shorts', 'Tops']);
  });

  it('still renders the header, wordmark and icons with no menu when Strapi returns nothing (AC11)', async () => {
    await renderNav({ categories: [], subcategoryGenders: null });

    expect(screen.getByRole('link', { name: 'WESTLINE' })).toBeInTheDocument();
    expect(within(desktop()).queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Cart' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Menu' })).toBeInTheDocument();
  });
});
