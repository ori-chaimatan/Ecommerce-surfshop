// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// STRAPI_URL is read when the module loads, so each test pins it and re-imports.
async function loadStrapiMediaUrl() {
  vi.resetModules();
  return (await import('@/lib/strapi/media')).strapiMediaUrl;
}

describe('strapiMediaUrl', () => {
  beforeEach(() => {
    vi.stubEnv('STRAPI_URL', 'http://strapi.test:1337');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('makes relative Strapi upload URLs absolute against STRAPI_URL (AC2)', async () => {
    const strapiMediaUrl = await loadStrapiMediaUrl();
    expect(strapiMediaUrl('/uploads/tideline_1.png')).toBe('http://strapi.test:1337/uploads/tideline_1.png');
  });

  it('passes absolute URLs through unchanged (AC2)', async () => {
    const strapiMediaUrl = await loadStrapiMediaUrl();
    expect(strapiMediaUrl('https://cdn.example.com/tideline_1.png')).toBe('https://cdn.example.com/tideline_1.png');
  });
});
