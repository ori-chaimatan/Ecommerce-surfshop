import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockGetHomepageHero = vi.fn();

vi.mock('@/lib/strapi/homepage', () => ({
  getHomepageHero: () => mockGetHomepageHero(),
}));

import { Hero } from '@/components/home/hero/Hero';

describe('Hero', () => {
  beforeEach(() => {
    mockGetHomepageHero.mockReset();
  });

  it('renders the carousel with the Strapi slides (AC1)', async () => {
    mockGetHomepageHero.mockResolvedValue([
      {
        headline: 'Westline',
        cta: { text: 'Shop Now', href: '/catalog', target: '_self' },
        image: { src: 'http://localhost:1337/uploads/slide_1.jpg', width: 1050, height: 699 },
      },
    ]);

    render(await Hero());

    expect(screen.getByRole('heading', { level: 1, name: 'Westline' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Shop Now' })).toHaveAttribute('href', '/catalog');
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
  });

  it('falls back to the Coming Soon wordmark when there are no slides (AC13)', async () => {
    mockGetHomepageHero.mockResolvedValue([]);

    render(await Hero());

    expect(screen.getByRole('heading', { level: 1, name: 'WESTLINE' })).toBeInTheDocument();
    expect(screen.getByText('Coming Soon')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Featured' })).not.toBeInTheDocument();
  });

  it('puts the fallback on the page background token (AC13)', async () => {
    mockGetHomepageHero.mockResolvedValue([]);

    render(await Hero());

    const fallback = screen.getByRole('heading', { level: 1, name: 'WESTLINE' }).parentElement!.parentElement!;
    expect(fallback).toHaveClass('bg-background');
    expect(fallback.className).not.toMatch(/F9F9F9/i);
  });
});
