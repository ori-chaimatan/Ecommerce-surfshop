import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import seed from '../../scripts/seed-homepage.js';

const { HOMEPAGE_UID, assertNotProduction, readFeatured, readSlides, seedHomepage, slideImagePath } = seed as {
  readFeatured: (dir?: string) => { FeaturedEyebrow: string | null; FeaturedTitle: string | null };
  HOMEPAGE_UID: string;
  assertNotProduction: () => void;
  readSlides: (dir: string) => { key: string; Title: string; Button: { Text: string; LinkUrl: string } }[];
  seedHomepage: (
    strapi: unknown,
    slides: unknown[],
    deps: { imageFor: (slide: { key: string; Title: string }) => Promise<number>; removeUploads: (ids: number[]) => Promise<void> },
    featured?: { FeaturedEyebrow?: string | null; FeaturedTitle?: string | null }
  ) => Promise<'created' | 'skipped'>;
  slideImagePath: (dir: string, key: string) => string | null;
};

const SLIDES = [
  { key: 'westline', Title: 'Westline', Button: { Text: 'Shop Now', LinkUrl: '/products' } },
  { key: 'dawn-patrol', Title: 'The Dawn Patrol Collection', Button: { Text: 'Shop the Collection', LinkUrl: '/products' } },
];

function fakeStrapi(existing: unknown = null) {
  const homepage = { findFirst: vi.fn(async () => existing), create: vi.fn(async () => ({ documentId: 'home' })) };
  const strapi = { documents: vi.fn(() => homepage) };
  return { strapi, homepage };
}

describe('seedHomepage (home-hero: home shows the hero on a fresh DB)', () => {
  it('creates the homepage with every slide, its uploaded image and its CTA, in order', async () => {
    const { strapi, homepage } = fakeStrapi();
    const imageFor = vi.fn(async (slide: { key: string }) => (slide.key === 'westline' ? 11 : 12));

    await expect(seedHomepage(strapi, SLIDES, { imageFor, removeUploads: vi.fn() })).resolves.toBe('created');

    expect(strapi.documents).toHaveBeenCalledWith(HOMEPAGE_UID);
    expect(homepage.create).toHaveBeenCalledWith({
      data: {
        Hero: [
          { Title: 'Westline', BackgroundImg: 11, Button: { Text: 'Shop Now', LinkUrl: '/products' } },
          { Title: 'The Dawn Patrol Collection', BackgroundImg: 12, Button: { Text: 'Shop the Collection', LinkUrl: '/products' } },
        ],
      },
    });
  });

  it('sets the Featured gear section copy when given (home-featured-gear AC1)', async () => {
    const { strapi, homepage } = fakeStrapi();

    await seedHomepage(strapi, SLIDES, { imageFor: vi.fn(async () => 11), removeUploads: vi.fn() }, { FeaturedEyebrow: 'New in', FeaturedTitle: 'Featured gear' });

    expect(homepage.create.mock.calls[0][0]).toMatchObject({ data: { FeaturedEyebrow: 'New in', FeaturedTitle: 'Featured gear' } });
  });

  it('is create-only: an existing homepage is left untouched and nothing is uploaded', async () => {
    const { strapi, homepage } = fakeStrapi({ documentId: 'home', Hero: [] });
    const imageFor = vi.fn();

    await expect(seedHomepage(strapi, SLIDES, { imageFor, removeUploads: vi.fn() })).resolves.toBe('skipped');

    expect(homepage.create).not.toHaveBeenCalled();
    expect(imageFor).not.toHaveBeenCalled();
  });

  it('removes the uploads it made when the create fails, so a rerun starts clean', async () => {
    const { strapi, homepage } = fakeStrapi();
    homepage.create.mockRejectedValue(new Error('db down'));
    const removeUploads = vi.fn(async () => {});

    await expect(
      seedHomepage(strapi, SLIDES, { imageFor: vi.fn(async (slide: { key: string }) => (slide.key === 'westline' ? 11 : 12)), removeUploads })
    ).rejects.toThrow('db down');
    expect(removeUploads).toHaveBeenCalledWith([11, 12]);
  });
});

describe('seed data and guards', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
    delete process.env.ALLOW_SEED;
  });

  it('ships the three home-hero slides with their CTAs', () => {
    const slides = readSlides(path.join(__dirname, '..', '..', 'seed', 'homepage'));
    expect(slides.map((slide) => [slide.Title, slide.Button.Text, slide.Button.LinkUrl])).toEqual([
      ['Westline', 'Shop Now', '/products'],
      ['Find your Surfboard', 'Take the Finder', '/surfboard-finder'],
      ['The Dawn Patrol Collection', 'Shop the Collection', '/products'],
    ]);
  });

  it('ships the Featured gear copy from the design (home-featured-gear AC1)', () => {
    expect(readFeatured(path.join(__dirname, '..', '..', 'seed', 'homepage'))).toEqual({ FeaturedEyebrow: 'New in', FeaturedTitle: 'Featured gear' });
  });

  it('rejects unsafe slide keys', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-homepage-test-'));
    fs.writeFileSync(path.join(dir, 'homepage.json'), JSON.stringify({ slides: [{ ...SLIDES[0], key: '../x' }] }));
    expect(() => readSlides(dir)).toThrow(/unsafe key/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('refuses production unless ALLOW_SEED is set', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertNotProduction()).toThrow(/refuses to run/);
    process.env.ALLOW_SEED = '1';
    expect(() => assertNotProduction()).not.toThrow();
  });

  describe('slideImagePath', () => {
    let dir: string;
    beforeEach(() => {
      dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-homepage-img-'));
    });
    afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

    it('prefers images-local/, then the committed folder, else null (placeholder)', () => {
      expect(slideImagePath(dir, 'westline')).toBeNull();
      fs.writeFileSync(path.join(dir, 'westline.jpg'), 'x');
      expect(slideImagePath(dir, 'westline')).toBe(path.join(dir, 'westline.jpg'));
      fs.mkdirSync(path.join(dir, 'images-local'));
      fs.writeFileSync(path.join(dir, 'images-local', 'westline.jpg'), 'x');
      expect(slideImagePath(dir, 'westline')).toBe(path.join(dir, 'images-local', 'westline.jpg'));
    });
  });
});
