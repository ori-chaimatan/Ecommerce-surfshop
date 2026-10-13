// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatPrice, toProductCard, type StrapiProduct } from '@/shared/components/product-card/product-card';

function image(n: number) {
  return { url: `/uploads/photo_${n}.jpg`, width: 700, height: 874 };
}

function product(overrides: Partial<StrapiProduct> = {}): StrapiProduct {
  return {
    Name: 'Samurai Pro 22" Boardshort',
    Slug: 'samurai-pro-22-boardshort',
    Price: 79,
    Images: [image(1), image(2)],
    Category: { Slug: 'mens-clothing' },
    ...overrides,
  };
}

describe('toProductCard', () => {
  it('maps a Strapi product to a card with a /products/<slug> href and absolute image URLs (AC1, AC2)', () => {
    expect(toProductCard(product())).toEqual({
      slug: 'samurai-pro-22-boardshort',
      name: 'Samurai Pro 22" Boardshort',
      price: 79,
      href: '/products/samurai-pro-22-boardshort',
      images: [
        { src: 'http://localhost:1337/uploads/photo_1.jpg', width: 700, height: 874 },
        { src: 'http://localhost:1337/uploads/photo_2.jpg', width: 700, height: 874 },
      ],
      imageFit: 'cover',
    });
  });

  it('keeps at most the first 4 images, in order (AC1)', () => {
    const card = toProductCard(product({ Images: [1, 2, 3, 4, 5, 6].map(image) }));

    expect(card?.images.map((i) => i.src)).toEqual([1, 2, 3, 4].map((n) => `http://localhost:1337/uploads/photo_${n}.jpg`));
  });

  it('coerces a string decimal price from Postgres ("829.00" → 829) (AC1)', () => {
    const card = toProductCard(product({ Price: '829.00' }));

    expect(card?.price).toBe(829);
    expect(formatPrice(card!.price)).toBe('$829');
  });

  it('returns null when the price is not a finite number (AC1)', () => {
    expect(toProductCard(product({ Price: 'n/a' }))).toBeNull();
    expect(toProductCard(product({ Price: null }))).toBeNull();
    expect(toProductCard(product({ Price: undefined }))).toBeNull();
  });

  it('returns null when Name or Slug is missing (AC1)', () => {
    expect(toProductCard(product({ Name: '' }))).toBeNull();
    expect(toProductCard(product({ Slug: undefined }))).toBeNull();
  });

  it('returns null when Images is empty or missing — Images are required in Strapi (AC1)', () => {
    expect(toProductCard(product({ Images: [] }))).toBeNull();
    expect(toProductCard(product({ Images: null }))).toBeNull();
    expect(toProductCard(product({ Images: undefined }))).toBeNull();
  });

  it('fits surfboard photos with contain and everything else with cover, derived from Category (AC3)', () => {
    expect(toProductCard(product({ Category: { Slug: 'surfboards' } }))?.imageFit).toBe('contain');
    expect(toProductCard(product({ Category: { Slug: 'wetsuits' } }))?.imageFit).toBe('cover');
    expect(toProductCard(product({ Category: null }))?.imageFit).toBe('cover');
    expect(toProductCard(product({ Category: undefined }))?.imageFit).toBe('cover');
  });
});

describe('formatPrice', () => {
  it('formats whole amounts without cents and fractional amounts with two decimals (AC4)', () => {
    expect(formatPrice(829)).toBe('$829');
    expect(formatPrice(79)).toBe('$79');
    expect(formatPrice(49.5)).toBe('$49.50');
    expect(formatPrice(1299)).toBe('$1,299');
  });
});
