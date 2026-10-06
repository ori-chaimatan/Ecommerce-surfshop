import { describe, expect, it } from 'vitest';
import { buildBreadcrumb, toSurfboardDetail } from '@/components/product-detail/surfboard-detail';
import type { StrapiProductDetail, StrapiSurfboardSpecs } from '@/lib/strapi/product';

const specs: StrapiSurfboardSpecs = {
  SkillLevel: 'Intermediate',
  Video: null,
  WaveSize: 34,
  Break: 50,
  Power: 44,
  Approach: 58,
  FootOrientation: 50,
  Foil: 46,
  NoseShape: 40,
  TailWidth: 52,
  EntryRocker: 45,
  ExitRocker: 48,
  RockerStyle: 42,
};

function surfboard(extra: Partial<StrapiProductDetail> = {}): StrapiProductDetail {
  return {
    Name: 'Tideline 6\'0" Performance Shortboard',
    Slug: 'tideline',
    Price: 829,
    Description: '> "Fast and loose."',
    SizeType: 'Surfboard',
    Images: [
      { url: '/uploads/a.jpg', width: 800, height: 1600 },
      { url: 'https://cdn.example.com/b.jpg', width: 900, height: 1800 },
    ],
    Category: { Name: 'Surfboards', Slug: 'surfboards' },
    BoardSizes: [
      { LengthFt: 6, LengthInches: 2, VolumeL: 31, Stock: 4 },
      { LengthFt: 5, LengthInches: 10, VolumeL: 27.6, Stock: 0 },
      { LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 5 },
    ],
    SurfboardSpecs: specs,
    ...extra,
  };
}

function itemsOf(product: StrapiProductDetail) {
  return toSurfboardDetail(product)!.attributes!.flatMap((section) => section.items);
}

function valueOf(product: StrapiProductDetail, label: string) {
  return itemsOf(product).find((item) => item.label === label)!.value;
}

describe('toSurfboardDetail', () => {
  it('maps the core fields', () => {
    const detail = toSurfboardDetail(surfboard())!;

    expect(detail.name).toBe('Tideline 6\'0" Performance Shortboard');
    expect(detail.price).toBe('$829');
    expect(detail.category).toEqual({ name: 'Surfboards', href: '/products/category/surfboards' });
    expect(detail.descriptionMarkdown).toBe('> "Fast and loose."');
    expect(detail.images).toEqual([
      { src: 'http://localhost:1337/uploads/a.jpg', width: 800, height: 1600 },
      { src: 'https://cdn.example.com/b.jpg', width: 900, height: 1800 },
    ]);
  });

  it.each([
    ['a Standard product', { SizeType: 'Standard' as const }],
    ['no SizeType', { SizeType: null }],
    ['no name', { Name: '' }],
    ['a non-numeric price', { Price: 'abc' }],
    ['no price', { Price: null }],
    ['no images', { Images: [] }],
    ['no category', { Category: null }],
    ['a category without a slug', { Category: { Name: 'Surfboards' } }],
  ])('returns null for %s (AC3)', (_, extra) => {
    expect(toSurfboardDetail(surfboard(extra))).toBeNull();
  });

  it('accepts a decimal price given as a string', () => {
    expect(toSurfboardDetail(surfboard({ Price: '829.5' }))!.price).toBe('$829.50');
  });

  describe('sizes (AC11)', () => {
    it('sorts by length, formats with formatBoardSize, flags sold out and defaults to the first in-stock size', () => {
      const detail = toSurfboardDetail(surfboard())!;

      expect(detail.sizes).toEqual([
        { label: '5\'10" · 27.6L', soldOut: true },
        { label: '6\'0" · 29.4L', soldOut: false },
        { label: '6\'2" · 31L', soldOut: false },
      ]);
      expect(detail.defaultSizeIndex).toBe(1);
    });

    it('sorts by total length, so 5\'11" < 6\'0" < 9\'11" < 10\'0" whatever the input order', () => {
      const detail = toSurfboardDetail(
        surfboard({
          BoardSizes: [
            { LengthFt: 10, LengthInches: 0, VolumeL: 90, Stock: 1 },
            { LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 1 },
            { LengthFt: 9, LengthInches: 11, VolumeL: 82, Stock: 1 },
            { LengthFt: 5, LengthInches: 11, VolumeL: 28.3, Stock: 1 },
          ],
        }),
      )!;

      expect(detail.sizes.map((size) => size.label)).toEqual([`5'11" · 28.3L`, `6'0" · 29.4L`, `9'11" · 82L`, `10'0" · 90L`]);
    });

    it('has no default when every size is sold out', () => {
      const detail = toSurfboardDetail(surfboard({ BoardSizes: [{ LengthFt: 6, LengthInches: 0, VolumeL: 29.4, Stock: 0 }] }))!;

      expect(detail.sizes).toEqual([{ label: '6\'0" · 29.4L', soldOut: true }]);
      expect(detail.defaultSizeIndex).toBe(-1);
    });

    it('has no sizes when BoardSizes is missing', () => {
      const detail = toSurfboardDetail(surfboard({ BoardSizes: null }))!;

      expect(detail.sizes).toEqual([]);
      expect(detail.defaultSizeIndex).toBe(-1);
    });
  });

  describe('attributes (AC10)', () => {
    it('builds 12 scales in three sections, in design order, with their scale labels', () => {
      const detail = toSurfboardDetail(surfboard())!;

      expect(detail.attributes!.map((section) => section.title)).toEqual(['Wave', 'Performance', 'Shape']);
      expect(detail.attributes!.map((section) => section.items.map((item) => [item.label, item.scale]))).toEqual([
        [
          ['Size', ['Knee', 'Double+']],
          ['Break', ['Point', 'Reef', 'Beachbreak']],
          ['Power', ['Weak / Mushy', 'Medium / Steep', 'Strong / Barrels']],
        ],
        [
          ['Approach', ['Vertical / Pocket', 'Power / Carving', 'Cruisy / Positional']],
          ['Skill Level', ['Beginner', 'Intermediate', 'Advanced']],
          ['Foot Orientation', ['Back Foot', 'Neutral', 'Front Foot']],
        ],
        [
          ['Foil / Rails', ['Thin', 'Medium', 'Full']],
          ['Nose Shape', ['Pointed', 'Hybrid', 'Round']],
          ['Tail Width', ['Narrow', 'Medium', 'Wide']],
          ['Entry Rocker', ['Relaxed', 'Medium', 'Aggressive']],
          ['Exit Rocker', ['Relaxed', 'Medium', 'Aggressive']],
          ['Rocker Style', ['Staged', 'Continuous']],
        ],
      ]);
    });

    it('keeps every numeric value exactly as stored', () => {
      expect(itemsOf(surfboard()).map((item) => item.value)).toEqual([34, 50, 44, 58, 50, 50, 46, 40, 52, 45, 48, 42]);
    });

    it.each([
      [34, 34],
      [1, 1],
      [100, 100],
      [37.5, 37.5],
      [0, 1],
      [-5, 1],
      [150, 100],
    ])('value %s renders as %s (clamped to 1–100 only when out of range)', (stored, shown) => {
      expect(valueOf(surfboard({ SurfboardSpecs: { ...specs, WaveSize: stored } }), 'Size')).toBe(shown);
    });

    it.each([
      ['Beginner', 1],
      ['Intermediate', 50],
      ['Advanced', 100],
    ] as const)('maps Skill Level %s to %s', (level, value) => {
      expect(valueOf(surfboard({ SurfboardSpecs: { ...specs, SkillLevel: level } }), 'Skill Level')).toBe(value);
    });

    it('drops a scale whose value is missing', () => {
      const labels = itemsOf(surfboard({ SurfboardSpecs: { ...specs, Power: null } })).map((item) => item.label);

      expect(labels).not.toContain('Power');
      expect(labels).toHaveLength(11);
    });

    it('has no attributes when SurfboardSpecs is missing', () => {
      expect(toSurfboardDetail(surfboard({ SurfboardSpecs: null }))!.attributes).toBeUndefined();
    });

    it('never exposes fin data (AC12)', () => {
      const detail = toSurfboardDetail(surfboard());

      expect(JSON.stringify(detail)).not.toMatch(/fin/i);
    });
  });

  describe('video (AC9)', () => {
    it('maps the shaper video', () => {
      const detail = toSurfboardDetail(surfboard({ SurfboardSpecs: { ...specs, Video: { url: '/uploads/shaper.mp4', mime: 'video/mp4' } } }))!;

      expect(detail.video).toEqual({ src: 'http://localhost:1337/uploads/shaper.mp4', type: 'video/mp4' });
    });

    it('has no video when none is set', () => {
      expect(toSurfboardDetail(surfboard())!.video).toBeUndefined();
    });
  });
});

describe('buildBreadcrumb (AC5)', () => {
  it('is Home / Category / Product, with every item but the last linked', () => {
    expect(buildBreadcrumb(toSurfboardDetail(surfboard()))).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Surfboards', href: '/products/category/surfboards' },
      { label: 'Tideline 6\'0" Performance Shortboard' },
    ]);
  });

  it('is just Home when the product could not be loaded (AC4)', () => {
    expect(buildBreadcrumb(null)).toEqual([{ label: 'Home' }]);
  });
});
