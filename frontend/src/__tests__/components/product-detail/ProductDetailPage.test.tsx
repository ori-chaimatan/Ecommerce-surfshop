import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ProductBySlugResult, StrapiProductDetail } from '@/lib/strapi/product';
import { renderWithCart } from '../cart/cart-test-utils';

const mockGetProductBySlug = vi.fn();

vi.mock('@/lib/strapi/product', () => ({ getProductBySlug: (slug: string) => mockGetProductBySlug(slug) }));
vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));

import { ProductDetailPage } from '@/components/product-detail';

function surfboard(extra: Partial<StrapiProductDetail> = {}): StrapiProductDetail {
  return {
    documentId: 'board-doc',
    Name: 'Tideline 6\'0" Performance Shortboard',
    Slug: 'tideline',
    Price: 829,
    Description: 'Fast and loose.',
    SizeType: 'Surfboard',
    Images: [{ url: '/uploads/a.jpg', width: 800, height: 1600 }],
    Category: { Name: 'Surfboards', Slug: 'surfboards' },
    BoardSizes: [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 5 }],
    SurfboardSpecs: {
      SkillLevel: 'Intermediate',
      Video: null,
      WaveSize: 34,
      Break: 1,
      Power: 100,
      Approach: 58,
      FootOrientation: 50,
      Foil: 46,
      NoseShape: 40,
      TailWidth: 52,
      EntryRocker: 45,
      ExitRocker: 48,
      RockerStyle: 42,
    },
    ...extra,
  };
}

async function renderPage(result: ProductBySlugResult = { kind: 'ok', product: surfboard() }) {
  mockGetProductBySlug.mockResolvedValue(result);
  return renderWithCart(await ProductDetailPage({ productSlug: 'tideline' }));
}

function meter(label: string) {
  return screen.getByRole('meter', { name: label });
}

function part(element: HTMLElement, name: string) {
  return element.querySelector<HTMLElement>(`[data-part="${name}"]`)!;
}

describe('ProductDetailPage', () => {
  afterEach(() => {
    mockGetProductBySlug.mockReset();
  });

  it('fetches the product by its slug (AC2)', async () => {
    await renderPage();

    expect(mockGetProductBySlug).toHaveBeenCalledWith('tideline');
  });

  it('renders the breadcrumb, eyebrow and heading (AC5)', async () => {
    await renderPage();

    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByRole('link', { name: 'Surfboards' })).toHaveAttribute('href', '/products/category/surfboards');
    expect(within(breadcrumb).getByText('Tideline 6\'0" Performance Shortboard').tagName).toBe('SPAN');
    expect(screen.getByRole('heading', { level: 1, name: 'Tideline 6\'0" Performance Shortboard' })).toBeInTheDocument();
    expect(screen.getAllByText('Surfboards')).toHaveLength(2);
  });

  it('renders the gallery, description and buy panel', async () => {
    await renderPage();

    expect(screen.getByRole('button', { name: 'Open photo 1 of 1' })).toBeInTheDocument();
    expect(screen.getByText('Fast and loose.')).toBeInTheDocument();
    expect(screen.getByText('$829')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeInTheDocument();
  });

  describe('attributes (AC10)', () => {
    it('shows 3 sections with 12 meters, all on a 1–100 range', async () => {
      await renderPage();

      expect(screen.getByText('Attributes')).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
        'Wave',
        'Performance',
        'Shape',
      ]);
      const meters = screen.getAllByRole('meter');
      expect(meters).toHaveLength(12);
      meters.forEach((m) => {
        expect(m).toHaveAttribute('aria-valuemin', '1');
        expect(m).toHaveAttribute('aria-valuemax', '100');
      });
    });

    it.each([
      ['Size', '34'],
      ['Break', '1'],
      ['Power', '100'],
    ])('draws %s at exactly %s%%: fill width, marker centre and aria-valuenow', async (label, value) => {
      await renderPage();

      const m = meter(label);
      expect(m).toHaveAttribute('aria-valuenow', value);
      expect(part(m, 'fill').style.width).toBe(`${value}%`);
      expect(part(m, 'marker').style.left).toBe(`${value}%`);
      expect(part(m, 'marker')).toHaveClass('-translate-x-1/2');
    });

    it('draws the Skill Level enum at its mapped point', async () => {
      await renderPage();

      expect(meter('Skill Level')).toHaveAttribute('aria-valuenow', '50');
      expect(part(meter('Skill Level'), 'marker').style.left).toBe('50%');
    });

    it('places scale labels at their true start, middle and end points', async () => {
      await renderPage();

      const threeLabels = within(screen.getByTestId('scale-Break'));
      expect(threeLabels.getByText('Point')).toHaveAttribute('data-position', 'start');
      expect(threeLabels.getByText('Reef')).toHaveAttribute('data-position', 'middle');
      expect(threeLabels.getByText('Beachbreak')).toHaveAttribute('data-position', 'end');
      expect(threeLabels.getByText('Point')).toHaveClass('left-0');
      expect(threeLabels.getByText('Reef')).toHaveClass('left-1/2', '-translate-x-1/2');
      expect(threeLabels.getByText('Beachbreak')).toHaveClass('right-0');

      const twoLabels = within(screen.getByTestId('scale-Size'));
      expect(twoLabels.getByText('Knee')).toHaveAttribute('data-position', 'start');
      expect(twoLabels.getByText('Double+')).toHaveAttribute('data-position', 'end');
    });

    it('hides the section when there are no SurfboardSpecs', async () => {
      await renderPage({ kind: 'ok', product: surfboard({ SurfboardSpecs: null }) });

      expect(screen.queryByText('Attributes')).not.toBeInTheDocument();
      expect(screen.queryAllByRole('meter')).toHaveLength(0);
    });
  });

  describe('video (AC9)', () => {
    it('shows the shaper video when set', async () => {
      const product = surfboard();
      product.SurfboardSpecs = { ...product.SurfboardSpecs, Video: { url: '/uploads/shaper.mp4', mime: 'video/mp4' } };
      const { container } = await renderPage({ kind: 'ok', product });

      const video = container.querySelector('video')!;
      expect(video).toHaveAttribute('controls');
      expect(video).toHaveAttribute('playsinline');
      expect(video).toHaveAttribute('preload', 'metadata');
      expect(video.querySelector('source')).toHaveAttribute('src', 'http://localhost:1337/uploads/shaper.mp4');
    });

    it('has no video block otherwise', async () => {
      const { container } = await renderPage();

      expect(container.querySelector('video')).toBeNull();
    });
  });

  describe('not found (AC3)', () => {
    it('404s when no product has the slug', async () => {
      await expect(renderPage({ kind: 'not-found' })).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('404s for a product type no layout renders', async () => {
      const product = surfboard({ SizeType: 'Other' as unknown as StrapiProductDetail['SizeType'] });
      await expect(renderPage({ kind: 'ok', product })).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('404s when a required field is missing', async () => {
      await expect(renderPage({ kind: 'ok', product: surfboard({ Images: [] }) })).rejects.toThrow('NEXT_NOT_FOUND');
    });
  });

  it('shows the unavailable state, not a 404, when Strapi is down (AC4)', async () => {
    await renderPage({ kind: 'unavailable' });

    expect(screen.getByText("This product couldn't be loaded right now.")).toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toHaveTextContent(/^Home$/);
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('renders none of the hidden design features (AC12)', async () => {
    const product = surfboard({ Subtitle: 'Hidden subtitle' } as Partial<StrapiProductDetail>);
    product.SurfboardSpecs = { ...product.SurfboardSpecs, FinSetup: 'Thruster', FinSetupNote: 'Hidden note' } as typeof product.SurfboardSpecs;
    await renderPage({ kind: 'ok', product });

    expect(screen.queryByText(/thruster|fin setup|3-fin|hidden note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/wishlist|share|material|fin system|more options|you might also like|house shaper/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden subtitle')).not.toBeInTheDocument();
  });

  describe('standard products (standard-product-detail-page)', () => {
    function standard(extra: Partial<StrapiProductDetail> = {}): StrapiProductDetail {
      return {
        documentId: 'shorts-doc',
        Name: 'Samurai Pro 22" Boardshort',
        Slug: 'samurai-pro-22-boardshort',
        Price: 79,
        Description: 'Built for **long sessions**.',
        SizeType: 'Standard',
        Gender: 'Men',
        Images: [
          { url: '/uploads/s1.jpg', width: 700, height: 874 },
          { url: '/uploads/s2.jpg', width: 700, height: 874 },
        ],
        Category: { Name: 'Clothing', Slug: 'clothing' },
        BoardSizes: [],
        StandardSizes: [
          { Size: 'M', Stock: 24 },
          { Size: 'S', Stock: 2 },
        ],
        SurfboardSpecs: null,
        ...extra,
      };
    }

    it('renders a Standard product from a single fetch (AC1)', async () => {
      await renderPage({ kind: 'ok', product: standard() });

      expect(mockGetProductBySlug).toHaveBeenCalledTimes(1);
      expect(screen.getByRole('heading', { level: 1, name: 'Samurai Pro 22" Boardshort' })).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /^Open photo/ })).toHaveLength(2);
      expect(screen.queryByRole('meter')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Dimensions')).not.toBeInTheDocument();
    });

    it('shows the gender level in the breadcrumb for clothing (AC5)', async () => {
      await renderPage({ kind: 'ok', product: standard() });

      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(within(breadcrumb).getByRole('link', { name: 'Clothing' })).toHaveAttribute('href', '/products/category/clothing');
      expect(within(breadcrumb).getByRole('link', { name: 'Men' })).toHaveAttribute('href', '/products/category/clothing?gender=men');
      expect(breadcrumb).toHaveTextContent('Home/Clothing/Men/Samurai Pro 22" Boardshort');
    });

    it('lays out the 2-column grid with a sticky buy column (AC6)', async () => {
      await renderPage({ kind: 'ok', product: standard() });

      const heading = screen.getByRole('heading', { level: 1 });
      const buyColumn = heading.parentElement!;
      expect(buyColumn).toHaveClass('sticky', 'top-[88px]', 'max-[900px]:static');
      expect(buyColumn.parentElement).toHaveClass('grid', 'grid-cols-[1.6fr_1fr]', 'gap-14', 'max-[900px]:grid-cols-1', 'max-[900px]:gap-7');
    });

    it('renders the buy column header, sizes, CTA, trust list and accordions (AC10–AC15)', async () => {
      await renderPage({ kind: 'ok', product: standard() });

      expect(screen.getByRole('heading', { level: 1 })).toHaveClass('font-display', 'font-extrabold', 'uppercase', 'text-[clamp(26px,3.4vw,38px)]');
      expect(screen.getByText('$79')).toHaveClass('text-2xl', 'font-bold', 'tabular-nums');
      expect(screen.getByRole('group', { name: 'Size — S' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'S — Low stock' })).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
      expect(screen.getByText('Free shipping over $75')).toBeInTheDocument();
      expect(screen.getByText('30-day returns')).toBeInTheDocument();
      expect(screen.getByText('Ships in 3–5 business days')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Description' })).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('long sessions').tagName).toBe('STRONG');
      expect(screen.getByRole('button', { name: 'Shipping & Returns' })).toHaveAttribute('aria-expanded', 'false');
    });

    it('uses the category name as the eyebrow (AC10)', async () => {
      await renderPage({ kind: 'ok', product: standard({ Gender: null }) });

      const heading = screen.getByRole('heading', { level: 1 });
      const eyebrow = heading.previousElementSibling!;
      expect(eyebrow).toHaveTextContent('Clothing');
      expect(eyebrow).toHaveClass('font-mono', 'text-horizon');
    });

    it('404s when a required field is missing (AC3)', async () => {
      await expect(renderPage({ kind: 'ok', product: standard({ Category: null }) })).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('renders none of the hidden design features (AC16)', async () => {
      const product = standard({ Subtitle: 'Performance stretch' } as Partial<StrapiProductDetail>);
      await renderPage({ kind: 'ok', product });

      expect(screen.queryByText('Performance stretch')).not.toBeInTheDocument();
      expect(screen.queryByText(/size chart|color|wishlist|you might also like|details & features|see details|quantity/i)).not.toBeInTheDocument();
    });
  });
});
