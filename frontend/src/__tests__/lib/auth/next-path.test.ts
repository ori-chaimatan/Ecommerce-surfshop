// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { safeNextPath } from '@/lib/auth/next-path';

describe('safeNextPath (checkout AC17)', () => {
  it.each(['/checkout', '/checkout/confirmation/WL-104233', '/products?page=2', '/cart#top'])('keeps the same-site path %s', (path) => {
    expect(safeNextPath(path)).toBe(path);
  });

  it.each([
    '//evil.com',
    '/\\evil.com',
    '/%5Cevil.com',
    '/%2F%2Fevil.com',
    'https://evil.com',
    'javascript:alert(1)',
    'checkout',
    ' /checkout',
    '',
    null,
    undefined,
    '/check\nout',
  ])('falls back to / for %j', (value) => {
    expect(safeNextPath(value as string | null | undefined)).toBe('/');
  });
});
