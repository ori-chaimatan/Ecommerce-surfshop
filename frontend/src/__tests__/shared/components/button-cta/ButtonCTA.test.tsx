import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ButtonCTA } from '@/shared/components/button-cta';

// Mark links rendered through next/link so internal vs external can be told apart (AC3).
vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} data-next-link="" {...props}>
      {children}
    </a>
  ),
}));

// The hero button's class list before the extraction — md must stay identical (AC2, AC8).
const HERO_MD_CLASSES =
  'inline-flex items-center gap-2 rounded-[9px] border-2 border-transparent bg-horizon px-[26px] py-[14px] text-sm font-bold uppercase tracking-[0.02em] text-horizon-ink no-underline hover:bg-horizon-deep';

function classes(el: HTMLElement) {
  return el.className.split(/\s+/).filter(Boolean).sort();
}

describe('ButtonCTA', () => {
  it('renders the text as a link to href (AC1)', () => {
    render(<ButtonCTA text="Shop Now" href="/catalog" />);

    expect(screen.getByRole('link', { name: 'Shop Now' })).toHaveAttribute('href', '/catalog');
  });

  it('defaults to size md with exactly the hero button class list (AC1, AC2)', () => {
    render(<ButtonCTA text="Shop Now" href="/catalog" />);

    expect(classes(screen.getByRole('link'))).toEqual(HERO_MD_CLASSES.split(' ').sort());
  });

  it('changes only padding and font size for sm and lg (AC2)', () => {
    const base = HERO_MD_CLASSES.split(' ').filter((c) => !['px-[26px]', 'py-[14px]', 'text-sm'].includes(c));

    const { rerender } = render(<ButtonCTA text="Shop Now" href="/catalog" size="sm" />);
    const sm = classes(screen.getByRole('link'));
    expect(sm).toEqual(expect.arrayContaining(base));
    expect(sm.filter((c) => !base.includes(c))).toHaveLength(3);
    expect(sm).not.toContain('px-[26px]');

    rerender(<ButtonCTA text="Shop Now" href="/catalog" size="lg" />);
    const lg = classes(screen.getByRole('link'));
    expect(lg).toEqual(expect.arrayContaining(base));
    expect(lg.filter((c) => !base.includes(c))).toHaveLength(3);
    expect(lg).not.toContain('px-[26px]');
    expect(lg).not.toEqual(sm);
  });

  it('uses next/link for internal hrefs and a plain <a> for external ones (AC3)', () => {
    const { rerender } = render(<ButtonCTA text="Home" href="/" />);
    expect(screen.getByRole('link')).toHaveAttribute('data-next-link');
    expect(screen.getByRole('link')).toHaveAttribute('href', '/');

    rerender(<ButtonCTA text="Section" href="#finder" />);
    expect(screen.getByRole('link')).toHaveAttribute('data-next-link');

    rerender(<ButtonCTA text="Partner" href="https://example.com/sale" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('data-next-link');
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/sale');

    rerender(<ButtonCTA text="Mail" href="mailto:hello@westline.example" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('data-next-link');
  });

  it('opens _blank links in a new tab with rel="noopener noreferrer" (AC4)', () => {
    const { rerender } = render(<ButtonCTA text="Partner" href="https://example.com" target="_blank" />);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');

    rerender(<ButtonCTA text="Catalog" href="/catalog" target="_blank" />);
    expect(screen.getByRole('link')).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('link')).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('sets neither target nor rel for _self, the default (AC4)', () => {
    const { rerender } = render(<ButtonCTA text="Catalog" href="/catalog" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
    expect(screen.getByRole('link')).not.toHaveAttribute('rel');

    rerender(<ButtonCTA text="Partner" href="https://example.com" target="_self" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('target');
    expect(screen.getByRole('link')).not.toHaveAttribute('rel');
  });

  it('passes tabIndex through and sets none by default (AC5)', () => {
    const { rerender } = render(<ButtonCTA text="Catalog" href="/catalog" tabIndex={-1} />);
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');

    rerender(<ButtonCTA text="Catalog" href="/catalog" />);
    expect(screen.getByRole('link')).not.toHaveAttribute('tabindex');

    rerender(<ButtonCTA text="Partner" href="https://example.com" tabIndex={-1} />);
    expect(screen.getByRole('link')).toHaveAttribute('tabindex', '-1');
  });
});
