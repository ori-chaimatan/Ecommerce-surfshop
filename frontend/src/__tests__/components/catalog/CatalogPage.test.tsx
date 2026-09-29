import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { StrapiNavCategory, SubcategoryGenders } from '@/lib/strapi/navigation';
import type { ProductList, ProductListQuery } from '@/lib/strapi/products';
import type { ProductCard } from '@/shared/components/product-card/product-card';

const mockGetNavigation = vi.fn();
const mockGetProductList = vi.fn();

vi.mock('@/lib/strapi/navigation', () => ({ getNavigation: () => mockGetNavigation() }));
vi.mock('@/lib/strapi/products', () => ({
  PAGE_SIZE: 16,
  getProductList: (query: ProductListQuery) => mockGetProductList(query),
}));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import { CatalogPage } from '@/components/catalog';

function cat(Slug: string, Name: string, subs: [string, string][]): StrapiNavCategory {
  return { Slug, Name, Subcategories: subs.map(([s, n]) => ({ Slug: s, Name: n, NavLabel: null })) };
}

const CATEGORIES = [
  cat('surfboards', 'Surfboards', [['longboard', 'Longboard']]),
  cat('accessories', 'Accessories', [['fins', 'Fins'], ['traction', 'Traction']]),
  cat('clothing', 'Clothing', [['shorts', 'Shorts'], ['tops', 'Tops']]),
];
const SUBCATEGORY_GENDERS: SubcategoryGenders = { shorts: ['Men'], tops: ['Women'] };

function card(n: number): ProductCard {
  return {
    slug: `product-${n}`,
    name: `Product ${n}`,
    price: 50 + n,
    href: `/products/product-${n}`,
    images: [{ src: `http://localhost:1337/uploads/p${n}.jpg`, width: 800, height: 1000 }],
    imageFit: 'cover',
  };
}

function list(count: number, total: number, pageCount: number): ProductList {
  return { products: Array.from({ length: count }, (_, i) => card(i + 1)), total, pageCount };
}

async function renderPage({
  categorySlug,
  searchParams = {},
  categories = CATEGORIES,
  products = list(16, 17, 2) as ProductList | null,
}: {
  categorySlug?: string;
  searchParams?: Record<string, string>;
  categories?: StrapiNavCategory[];
  products?: ProductList | null;
} = {}) {
  mockGetNavigation.mockResolvedValue({ categories, subcategoryGenders: SUBCATEGORY_GENDERS });
  mockGetProductList.mockResolvedValue(products);
  return render(await CatalogPage({ categorySlug, searchParams }));
}

function breadcrumb() {
  return screen.getByRole('navigation', { name: 'Breadcrumb' });
}

function pagination() {
  return screen.queryByRole('navigation', { name: 'Pagination' });
}

describe('CatalogPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('lists all products: heading, breadcrumb, result count and 16 cards (AC1, AC5, AC6)', async () => {
    await renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'All Products' })).toBeInTheDocument();
    expect(within(breadcrumb()).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb()).getByText('All Products')).not.toHaveAttribute('href');
    expect(screen.getByText('17 results')).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(16);
    expect(mockGetProductList).toHaveBeenCalledWith({ page: 1 });
  });

  it('loads the first row of 4 cards with priority; the rest lazy-load (AC5)', async () => {
    const { container } = await renderPage();

    const firstImages = Array.from(container.querySelectorAll('article')).map((a) => a.querySelector('img')!);
    firstImages.slice(0, 4).forEach((img) => expect(img).not.toHaveAttribute('loading', 'lazy'));
    firstImages.slice(4).forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));
  });

  it('renders a category with its filters passed to the fetcher and the category heading (AC2, AC6)', async () => {
    await renderPage({ categorySlug: 'clothing', searchParams: { sub: 'shorts', gender: 'men' }, products: list(1, 1, 1) });

    expect(mockGetProductList).toHaveBeenCalledWith({
      categorySlug: 'clothing',
      subcategorySlug: 'shorts',
      genders: ['Men', 'Unisex'],
      page: 1,
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Clothing' })).toBeInTheDocument();
    expect(within(breadcrumb()).getByRole('link', { name: 'Men' })).toHaveAttribute('href', '/products/category/clothing?gender=men');
    expect(screen.getByText('1 result')).toBeInTheDocument();
  });

  it('paginates with numbered links, Prev / Next, and keeps ?sub and ?gender (AC7)', async () => {
    await renderPage({ categorySlug: 'clothing', searchParams: { gender: 'women', page: '2' }, products: list(16, 40, 3) });

    const nav = pagination()!;
    expect(within(nav).getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Page 1' })).toHaveAttribute('href', '/products/category/clothing?gender=women');
    expect(within(nav).getByRole('link', { name: 'Previous page' })).toHaveAttribute(
      'href',
      '/products/category/clothing?gender=women'
    );
    expect(within(nav).getByRole('link', { name: 'Next page' })).toHaveAttribute(
      'href',
      '/products/category/clothing?gender=women&page=3'
    );
  });

  it('has no pagination for a single page (AC7)', async () => {
    await renderPage({ categorySlug: 'surfboards', products: list(8, 8, 1) });

    expect(pagination()).toBeNull();
  });

  it('shows the empty state with a link to the whole category (AC9)', async () => {
    await renderPage({ categorySlug: 'accessories', searchParams: { sub: 'traction' }, products: list(0, 0, 0) });

    const emptyState = screen.getByText('No products here yet').parentElement!;
    expect(within(emptyState).getByRole('link', { name: 'All Accessories' })).toHaveAttribute('href', '/products/category/accessories');
    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.queryByText(/results?$/)).toBeNull();
    expect(pagination()).toBeNull();
  });

  it('shows the unavailable message, not a 404, when Strapi is down (AC10)', async () => {
    await renderPage({ categorySlug: 'surfboards', categories: [] });
    expect(screen.getByText("Products couldn't be loaded right now.")).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Categories' })).toBeNull();
    expect(mockGetProductList).not.toHaveBeenCalled();
  });

  it('shows the unavailable message when the product request fails (AC10)', async () => {
    await renderPage({ products: null });

    expect(screen.getByText("Products couldn't be loaded right now.")).toBeInTheDocument();
    expect(screen.queryByText(/results?$/)).toBeNull();
  });

  it('404s an unknown category or subcategory and a malformed page (AC4)', async () => {
    await expect(renderPage({ categorySlug: 'nope' })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(renderPage({ categorySlug: 'surfboards', searchParams: { sub: 'fins' } })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(renderPage({ searchParams: { page: 'abc' } })).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('404s a page past the last one, but page 1 of an empty list is the empty state (AC4)', async () => {
    await expect(renderPage({ searchParams: { page: '3' }, products: list(0, 17, 2) })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(renderPage({ categorySlug: 'accessories', searchParams: { page: '2' }, products: list(0, 0, 0) })).rejects.toThrow(
      'NEXT_NOT_FOUND'
    );
  });

  it('renders the category sidebar with the active item (AC8)', async () => {
    await renderPage({ categorySlug: 'surfboards', searchParams: { sub: 'longboard' }, products: list(1, 1, 1) });

    expect(screen.getByRole('heading', { name: 'Categories' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Longboard' })).toHaveAttribute('aria-current', 'page');
  });

  it('renders no heart, sort, filters, Filter button or Finder callout (AC12)', async () => {
    await renderPage();

    expect(screen.queryByRole('button', { name: /wishlist/i })).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByText(/sort by/i)).toBeNull();
    expect(screen.queryByText(/filter/i)).toBeNull();
    expect(screen.queryByText(/finder/i)).toBeNull();
  });
});
