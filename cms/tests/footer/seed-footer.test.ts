import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import seed from '../../scripts/seed-footer.js';

interface FooterSeed {
  Tagline: string;
  Columns: { Title: string; Links: { Label: string; Url: string }[] }[];
  LegalLinks: { Label: string; Url: string }[];
  Copyright: string;
}

const { FOOTER_UID, assertNotProduction, readFooter, seedFooter } = seed as {
  FOOTER_UID: string;
  assertNotProduction: () => void;
  readFooter: (dir?: string) => FooterSeed;
  seedFooter: (strapi: unknown, footer: FooterSeed) => Promise<'created' | 'skipped'>;
};

const FOOTER: FooterSeed = {
  Tagline: 'Find Your Line.',
  Columns: [{ Title: 'Shop', Links: [{ Label: 'Surfboards', Url: '/products/category/surfboards' }] }],
  LegalLinks: [],
  Copyright: '© 2026 WESTLINE. Find Your Line.',
};

function fakeStrapi(existing: unknown = null) {
  const footer = { findFirst: vi.fn(async () => existing), create: vi.fn(async () => ({ documentId: 'footer' })) };
  return { strapi: { documents: vi.fn(() => footer) }, footer };
}

function tempSeed(data: unknown) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'seed-footer-test-'));
  fs.writeFileSync(path.join(dir, 'footer.json'), JSON.stringify(data));
  return dir;
}

describe('seedFooter (site-footer AC3)', () => {
  it('creates the footer with its columns, links, legal links and copyright', async () => {
    const { strapi, footer } = fakeStrapi();

    await expect(seedFooter(strapi, FOOTER)).resolves.toBe('created');

    expect(strapi.documents).toHaveBeenCalledWith(FOOTER_UID);
    expect(footer.create).toHaveBeenCalledWith({ data: FOOTER });
  });

  it('is create-only: an existing footer is left untouched', async () => {
    const { strapi, footer } = fakeStrapi({ documentId: 'footer' });

    await expect(seedFooter(strapi, FOOTER)).resolves.toBe('skipped');
    expect(footer.create).not.toHaveBeenCalled();
  });
});

describe('footer seed data (site-footer AC3)', () => {
  it('ships the design tagline, only links to existing pages, and the copyright', () => {
    const footer = readFooter();

    expect(footer.Tagline).toBe('Find Your Line. Surf equipment and lifestyle gear for the progressing surfer.');
    expect(footer.Columns.map((column) => [column.Title, column.Links.map((link) => `${link.Label} → ${link.Url}`)])).toEqual([
      ['Shop', ['Surfboards → /products/category/surfboards', 'Wetsuits → /products/category/wetsuits', 'Apparel → /products/category/clothing']],
      ['Account', ['Sign In → /auth/login', 'Create Account → /auth/register', 'Wishlist → /account#wishlist', 'Order History → /account#orders']],
    ]);
    expect(footer.LegalLinks).toEqual([]);
    expect(footer.Copyright).toBe('© 2026 WESTLINE. Find Your Line.');
  });

  it.each(['javascript:alert(1)', '//evil.example', 'ftp://x', ''])('rejects the unsafe link URL %j', (Url) => {
    const dir = tempSeed({ ...FOOTER, Columns: [{ Title: 'Shop', Links: [{ Label: 'Bad', Url }] }] });
    expect(() => readFooter(dir)).toThrow(/unsafe or empty URL/);
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects a link or column without a label', () => {
    const dir = tempSeed({ ...FOOTER, Columns: [{ Title: '', Links: [] }] });
    expect(() => readFooter(dir)).toThrow(/needs a Title/);
    fs.rmSync(dir, { recursive: true, force: true });
  });
});

describe('assertNotProduction', () => {
  const env = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = env;
    delete process.env.ALLOW_SEED;
  });

  it('refuses production unless ALLOW_SEED is set', () => {
    process.env.NODE_ENV = 'production';
    expect(() => assertNotProduction()).toThrow(/refuses to run/);
    process.env.ALLOW_SEED = '1';
    expect(() => assertNotProduction()).not.toThrow();
  });
});
