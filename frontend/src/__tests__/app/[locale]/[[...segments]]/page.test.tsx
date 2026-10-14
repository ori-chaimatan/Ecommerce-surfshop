import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND');
  },
}));
vi.mock('@/components/home/hero/Hero', () => ({ Hero: () => null }));
vi.mock('@/components/home/featured-gear', () => ({ FeaturedGear: () => null }));

import Home from '@/app/[locale]/[[...segments]]/page';
import { FeaturedGear } from '@/components/home/featured-gear';
import { Hero } from '@/components/home/hero/Hero';

describe('Home page (home-featured-gear AC1)', () => {
  it('renders the hero, then Featured gear', async () => {
    const element = (await Home({ params: {} })) as { props: { children: { type: unknown }[] } };
    expect(element.props.children.map((child) => child.type)).toEqual([Hero, FeaturedGear]);
  });

  it('404s any other path under the catch-all', async () => {
    await expect(Home({ params: { segments: ['nope'] } })).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
