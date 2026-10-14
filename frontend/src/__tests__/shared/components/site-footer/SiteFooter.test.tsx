import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getFooter: vi.fn() }));
vi.mock('@/lib/strapi/footer', () => ({ getFooter: mocks.getFooter }));

import { SiteFooter } from '@/shared/components/site-footer';

const FOOTER = {
  tagline: 'Find Your Line. Surf equipment and lifestyle gear for the progressing surfer.',
  columns: [
    {
      title: 'Shop',
      links: [
        { label: 'Surfboards', href: '/products/category/surfboards', external: false },
        { label: 'Blog', href: 'https://blog.example.com/', external: true },
      ],
    },
    { title: 'Account', links: [{ label: 'Wishlist', href: '/account#wishlist', external: false }] },
  ],
  legalLinks: [{ label: 'Privacy', href: '/privacy', external: false }],
  copyright: '© 2026 WESTLINE. Find Your Line.',
};

async function renderFooter() {
  render(await SiteFooter());
  return screen.getByRole('contentinfo');
}

describe('SiteFooter (site-footer AC1, AC4, AC5)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the brand, the columns in order and the bottom bar from Strapi (AC1)', async () => {
    mocks.getFooter.mockResolvedValue(FOOTER);
    const footer = await renderFooter();

    expect(within(footer).getByText('WESTLINE')).toBeInTheDocument();
    expect(within(footer).getByText(FOOTER.tagline)).toBeInTheDocument();
    expect(within(footer).getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Shop', 'Account']);
    const shop = within(footer).getByRole('heading', { name: 'Shop' }).parentElement!;
    expect(within(shop).getAllByRole('link').map((a) => a.textContent)).toEqual(['Surfboards', 'Blog']);
    expect(within(footer).getByText('© 2026 WESTLINE. Find Your Line.')).toBeInTheDocument();
    expect(within(footer).getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
  });

  it('links internal paths and external URLs (AC4)', async () => {
    mocks.getFooter.mockResolvedValue(FOOTER);
    const footer = await renderFooter();

    expect(within(footer).getByRole('link', { name: 'Surfboards' })).toHaveAttribute('href', '/products/category/surfboards');
    expect(within(footer).getByRole('link', { name: 'Wishlist' })).toHaveAttribute('href', '/account#wishlist');
    expect(within(footer).getByRole('link', { name: 'Blog' })).toHaveAttribute('href', 'https://blog.example.com/');
  });

  it('omits the legal list when there are no legal links', async () => {
    mocks.getFooter.mockResolvedValue({ ...FOOTER, legalLinks: [] });
    const footer = await renderFooter();
    expect(within(footer).queryByRole('list', { name: 'Legal' })).toBeNull();
  });

  it('falls back to the wordmark and default copyright when the footer is unavailable (AC5)', async () => {
    mocks.getFooter.mockResolvedValue(null);
    const footer = await renderFooter();

    expect(within(footer).getByText('WESTLINE')).toBeInTheDocument();
    expect(within(footer).getByText('© 2026 WESTLINE. Find Your Line.')).toBeInTheDocument();
    expect(within(footer).queryAllByRole('heading')).toHaveLength(0);
    expect(within(footer).queryAllByRole('link')).toHaveLength(0);
  });

  it('uses the default copyright when Strapi has none', async () => {
    mocks.getFooter.mockResolvedValue({ ...FOOTER, copyright: '' });
    const footer = await renderFooter();
    expect(within(footer).getByText('© 2026 WESTLINE. Find Your Line.')).toBeInTheDocument();
  });
});
