import { describe, expect, it } from 'vitest';
import { LOW_STOCK_MAX, toStandardDetail } from '@/components/product-detail/standard/standard-detail';
import type { StrapiProductDetail } from '@/lib/strapi/product';

function samurai(extra: Partial<StrapiProductDetail> = {}): StrapiProductDetail {
  return {
    Name: 'Samurai Pro 22" Boardshort',
    Slug: 'samurai-pro-22-boardshort',
    Price: 79,
    Description: 'Built for **long sessions**.',
    SizeType: 'Standard',
    Gender: 'Men',
    Images: [
      { url: '/uploads/samurai-1.jpg', width: 700, height: 874 },
      { url: '/uploads/samurai-2.jpg', width: 700, height: 874 },
    ],
    Category: { Name: 'Clothing', Slug: 'clothing' },
    BoardSizes: [],
    StandardSizes: [
      { Size: 'XL', Stock: 12 },
      { Size: 'S', Stock: 16 },
      { Size: 'L', Stock: 24 },
      { Size: 'M', Stock: 24 },
    ],
    SurfboardSpecs: null,
    ...extra,
  };
}

describe('toStandardDetail (AC3)', () => {
  it.each([
    ['a surfboard', { SizeType: 'Surfboard' as const }],
    ['no SizeType', { SizeType: null }],
    ['no name', { Name: '' }],
    ['no images', { Images: [] }],
    ['null images', { Images: null }],
    ['no category', { Category: null }],
    ['a category without a slug', { Category: { Name: 'Clothing' } }],
    ['a non-numeric price', { Price: 'abc' }],
    ['a missing price', { Price: null }],
  ])('returns null for %s', (_, extra) => {
    expect(toStandardDetail(samurai(extra))).toBeNull();
  });

  it('maps the header, price, description and images', () => {
    const detail = toStandardDetail(samurai())!;

    expect(detail.name).toBe('Samurai Pro 22" Boardshort');
    expect(detail.price).toBe('$79');
    expect(detail.category).toEqual({ name: 'Clothing', href: '/products/category/clothing' });
    expect(detail.descriptionMarkdown).toBe('Built for **long sessions**.');
    expect(detail.images).toEqual([
      { src: 'http://localhost:1337/uploads/samurai-1.jpg', width: 700, height: 874 },
      { src: 'http://localhost:1337/uploads/samurai-2.jpg', width: 700, height: 874 },
    ]);
  });

  it('treats a missing description as empty', () => {
    expect(toStandardDetail(samurai({ Description: null }))!.descriptionMarkdown).toBe('');
  });
});

describe('toStandardDetail sizes (AC11, AC12)', () => {
  it('orders sizes S, M, L, XL, One Size', () => {
    const detail = toStandardDetail(
      samurai({
        StandardSizes: [
          { Size: 'OneSize', Stock: 5 },
          { Size: 'XL', Stock: 5 },
          { Size: 'M', Stock: 5 },
          { Size: 'S', Stock: 5 },
          { Size: 'L', Stock: 5 },
        ],
      }),
    )!;

    expect(detail.sizes.map((size) => size.label)).toEqual(['S', 'M', 'L', 'XL', 'One Size']);
  });

  it(`flags Stock 0 as sold out and Stock 1–${LOW_STOCK_MAX} as low`, () => {
    const detail = toStandardDetail(
      samurai({
        StandardSizes: [
          { Size: 'S', Stock: 0 },
          { Size: 'M', Stock: 1 },
          { Size: 'L', Stock: 3 },
          { Size: 'XL', Stock: 4 },
        ],
      }),
    )!;

    expect(LOW_STOCK_MAX).toBe(3);
    expect(detail.sizes).toEqual([
      { label: 'S', soldOut: true, lowStock: false },
      { label: 'M', soldOut: false, lowStock: true },
      { label: 'L', soldOut: false, lowStock: true },
      { label: 'XL', soldOut: false, lowStock: false },
    ]);
  });

  it('defaults to the first in-stock size', () => {
    const detail = toStandardDetail(
      samurai({
        StandardSizes: [
          { Size: 'M', Stock: 2 },
          { Size: 'S', Stock: 0 },
        ],
      }),
    )!;

    expect(detail.defaultSizeIndex).toBe(1);
  });

  it.each([
    ['every size is sold out', [{ Size: 'S' as const, Stock: 0 }, { Size: 'M' as const, Stock: 0 }]],
    ['there are no sizes', []],
    ['sizes are null', null],
  ])('has no default when %s', (_, StandardSizes) => {
    expect(toStandardDetail(samurai({ StandardSizes }))!.defaultSizeIndex).toBe(-1);
  });
});

describe('toStandardDetail gender (AC5)', () => {
  it.each([
    ['Men', 'men'],
    ['Women', 'women'],
  ] as const)('links %s on a gendered category', (Gender, slug) => {
    expect(toStandardDetail(samurai({ Gender }))!.gender).toEqual({
      label: Gender,
      href: `/products/category/clothing?gender=${slug}`,
    });
  });

  it.each([
    ['a Unisex product', { Gender: 'Unisex' as const }],
    ['no gender', { Gender: null }],
    ['a category that is not gendered', { Category: { Name: 'Wetsuits', Slug: 'wetsuits' } }],
  ])('has no gender level for %s', (_, extra) => {
    expect(toStandardDetail(samurai(extra))!.gender).toBeUndefined();
  });
});
