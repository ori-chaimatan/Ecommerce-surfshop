import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeCard, withWishlist, fakeWishlist } from '../../wishlist/wishlist-test-utils';

const mocks = vi.hoisted(() => ({ getFeaturedProducts: vi.fn(), getHomepageFeaturedText: vi.fn() }));
vi.mock('@/lib/strapi/products', () => ({ getFeaturedProducts: mocks.getFeaturedProducts }));
vi.mock('@/lib/strapi/homepage', () => ({ getHomepageFeaturedText: mocks.getHomepageFeaturedText }));

import { FeaturedGear } from '@/components/home/featured-gear';

async function renderSection() {
  const element = await FeaturedGear();
  if (element) render(element, { wrapper: withWishlist(fakeWishlist()) });
  return element;
}

describe('FeaturedGear (home-featured-gear AC1, AC4)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the Homepage eyebrow and title above the featured products (AC1)', async () => {
    mocks.getFeaturedProducts.mockResolvedValue([makeCard('a'), makeCard('b')]);
    mocks.getHomepageFeaturedText.mockResolvedValue({ eyebrow: 'Fresh drops', title: 'Staff picks' });

    await renderSection();

    const section = screen.getByRole('region', { name: 'Staff picks' });
    expect(within(section).getByRole('heading', { level: 2, name: 'Staff picks' })).toBeInTheDocument();
    expect(within(section).getByText('Fresh drops')).toBeInTheDocument();
    expect(within(section).getAllByRole('article')).toHaveLength(2);
  });

  it('falls back to "New in" / "Featured gear" when the Homepage has no copy (AC1)', async () => {
    mocks.getFeaturedProducts.mockResolvedValue([makeCard('a')]);
    mocks.getHomepageFeaturedText.mockResolvedValue({ eyebrow: '', title: '' });

    await renderSection();

    expect(screen.getByRole('heading', { level: 2, name: 'Featured gear' })).toBeInTheDocument();
    expect(screen.getByText('New in')).toBeInTheDocument();
  });

  it('also falls back when the Homepage is missing', async () => {
    mocks.getFeaturedProducts.mockResolvedValue([makeCard('a')]);
    mocks.getHomepageFeaturedText.mockResolvedValue(null);
    await renderSection();
    expect(screen.getByRole('heading', { name: 'Featured gear' })).toBeInTheDocument();
  });

  it.each([
    ['no featured products', []],
    ['Strapi down', null],
  ])('renders nothing with %s (AC4)', async (_label, products) => {
    mocks.getFeaturedProducts.mockResolvedValue(products);
    mocks.getHomepageFeaturedText.mockResolvedValue({ eyebrow: 'New in', title: 'Featured gear' });
    expect(await renderSection()).toBeNull();
  });
});
