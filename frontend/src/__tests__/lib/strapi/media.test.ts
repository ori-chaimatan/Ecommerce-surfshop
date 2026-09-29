// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { strapiMediaUrl } from '@/lib/strapi/media';

describe('strapiMediaUrl', () => {
  it('makes relative Strapi upload URLs absolute against STRAPI_URL (AC2)', () => {
    expect(strapiMediaUrl('/uploads/tideline_1.png')).toBe('http://localhost:1337/uploads/tideline_1.png');
  });

  it('passes absolute URLs through unchanged (AC2)', () => {
    expect(strapiMediaUrl('https://cdn.example.com/tideline_1.png')).toBe('https://cdn.example.com/tideline_1.png');
  });
});
