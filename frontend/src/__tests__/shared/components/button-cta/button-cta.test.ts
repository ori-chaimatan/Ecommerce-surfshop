// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { toButtonCta } from '@/shared/components/button-cta';

describe('toButtonCta', () => {
  it('maps Text and LinkUrl to text and href, defaulting target to _self (AC6)', () => {
    expect(toButtonCta({ Text: 'Shop Now', LinkUrl: '/catalog' })).toEqual({
      text: 'Shop Now',
      href: '/catalog',
      target: '_self',
    });
  });

  it('maps targetLink _blank to _blank (AC6)', () => {
    expect(toButtonCta({ Text: 'Shop Now', LinkUrl: 'https://example.com', targetLink: { targetLink: '_blank' } })?.target).toBe('_blank');
  });

  it('treats a missing, null or _self targetLink as _self (AC6)', () => {
    expect(toButtonCta({ Text: 'a', LinkUrl: '/', targetLink: null })?.target).toBe('_self');
    expect(toButtonCta({ Text: 'a', LinkUrl: '/', targetLink: { targetLink: null } })?.target).toBe('_self');
    expect(toButtonCta({ Text: 'a', LinkUrl: '/', targetLink: { targetLink: '_self' } })?.target).toBe('_self');
    expect(toButtonCta({ Text: 'a', LinkUrl: '/', targetLink: {} })?.target).toBe('_self');
  });

  it('returns null when Text or LinkUrl is missing or empty (AC6)', () => {
    expect(toButtonCta({ Text: 'Shop Now' })).toBeNull();
    expect(toButtonCta({ Text: 'Shop Now', LinkUrl: '' })).toBeNull();
    expect(toButtonCta({ LinkUrl: '/catalog' })).toBeNull();
    expect(toButtonCta({ Text: null, LinkUrl: '/catalog' })).toBeNull();
  });

  it('returns null when the button itself is missing (AC6)', () => {
    expect(toButtonCta(null)).toBeNull();
    expect(toButtonCta(undefined)).toBeNull();
  });
});
