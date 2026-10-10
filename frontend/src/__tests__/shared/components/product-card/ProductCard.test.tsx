import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ProductCard } from '@/shared/components/product-card';
import type { ProductCard as ProductCardData } from '@/shared/components/product-card/product-card';

function card(overrides: Partial<ProductCardData> = {}, imageCount = 1): ProductCardData {
  return {
    slug: 'tideline-6-0-performance-shortboard',
    name: 'Tideline 6\'0" Performance Shortboard',
    price: 829,
    href: '/products/tideline-6-0-performance-shortboard',
    images: Array.from({ length: imageCount }, (_, i) => ({
      src: `http://localhost:1337/uploads/tideline_${i + 1}.png`,
      width: 640,
      height: 2424,
    })),
    imageFit: 'contain',
    ...overrides,
  };
}

function photos(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLImageElement>('img'));
}

function activePhotoIndex(container: HTMLElement) {
  return photos(container).findIndex((img) => img.dataset.active === 'true');
}

function dots() {
  return screen.queryAllByRole('button', { name: /^Show photo \d$/ });
}

describe('ProductCard', () => {
  it('shows the name as an h3 and the formatted price (AC4)', () => {
    render(<ProductCard product={card({ price: 49.5 })} />);

    expect(screen.getByRole('heading', { level: 3, name: 'Tideline 6\'0" Performance Shortboard' })).toBeInTheDocument();
    expect(screen.getByText('$49.50')).toBeInTheDocument();
  });

  it('pins the price row to the bottom of a flex-column card so prices line up across a row (AC4)', () => {
    const { container } = render(<ProductCard product={card()} />);

    const article = container.querySelector('article')!;
    expect(article).toHaveClass('flex', 'h-full', 'flex-col');
    const priceRow = screen.getByText('$829').parentElement!;
    expect(priceRow).toHaveClass('mt-auto');
    expect(priceRow.parentElement).toHaveClass('flex', 'flex-1', 'flex-col');
  });

  it('links the whole card to the product page with visually hidden "View <name>" text (AC7)', () => {
    render(<ProductCard product={card()} />);

    const link = screen.getByRole('link', { name: 'View Tideline 6\'0" Performance Shortboard' });
    expect(link).toHaveAttribute('href', '/products/tideline-6-0-performance-shortboard');
    expect(within(link).getByText(/^View /)).toHaveClass('sr-only');
  });

  it('gives the first photo the product name as alt and extra photos an empty alt (AC6)', () => {
    const { container } = render(<ProductCard product={card({}, 3)} />);

    const [first, ...rest] = photos(container);
    expect(first).toHaveAttribute('alt', 'Tideline 6\'0" Performance Shortboard');
    rest.forEach((img) => expect(img).toHaveAttribute('alt', ''));
  });

  it('loads only the first photo with priority when asked; the rest lazy-load (AC6)', () => {
    const { container } = render(<ProductCard product={card({}, 3)} priority />);

    const [first, ...rest] = photos(container);
    expect(first).not.toHaveAttribute('loading', 'lazy');
    rest.forEach((img) => expect(img).toHaveAttribute('loading', 'lazy'));
  });

  it('shows no photo dots for a single photo (AC5)', () => {
    const { container } = render(<ProductCard product={card({}, 1)} />);

    expect(dots()).toHaveLength(0);
    expect(photos(container)).toHaveLength(1);
  });

  it('shows one dot per photo for 2–4 photos, the first marked current (AC5)', () => {
    render(<ProductCard product={card({}, 3)} />);

    expect(dots()).toHaveLength(3);
    expect(dots().map((d) => d.getAttribute('aria-current'))).toEqual(['true', 'false', 'false']);
  });

  it('keeps the dots in the DOM and focusable, revealed on hover only on fine-pointer hover devices (AC5)', () => {
    const { container } = render(<ProductCard product={card({}, 2)} />);

    const group = screen.getByRole('group', { name: 'Photos' });
    expect(group).toHaveClass(
      '[@media(hover:hover)_and_(pointer:fine)]:opacity-0',
      '[@media(hover:hover)_and_(pointer:fine)]:group-hover/card:opacity-100',
      'group-focus-within/card:opacity-100',
      'transition-opacity',
      'motion-reduce:transition-none'
    );
    expect(group).not.toHaveClass('hidden', 'opacity-0');
    expect(container.querySelector('article')).toHaveClass('group/card');

    dots().forEach((dot) => {
      expect(dot).not.toHaveAttribute('tabindex', '-1');
      dot.focus();
      expect(dot).toHaveFocus();
    });
  });

  it('adds a subtle shadow on hover and focus-within, with no transition under reduced motion (AC4)', () => {
    const { container } = render(<ProductCard product={card()} />);

    expect(container.querySelector('article')).toHaveClass(
      'hover:shadow-[0_8px_24px_rgba(16,24,40,.08)]',
      'focus-within:shadow-[0_8px_24px_rgba(16,24,40,.08)]',
      'transition-shadow',
      'motion-reduce:transition-none'
    );
  });

  it('never shows more than 4 photos or dots (AC5)', () => {
    const { container } = render(<ProductCard product={card({}, 6)} />);

    expect(photos(container)).toHaveLength(4);
    expect(dots()).toHaveLength(4);
  });

  it('switches the visible photo and aria-current when a dot is clicked (AC5)', () => {
    const { container } = render(<ProductCard product={card({}, 3)} />);
    expect(activePhotoIndex(container)).toBe(0);

    fireEvent.click(screen.getByRole('button', { name: 'Show photo 3' }));

    expect(activePhotoIndex(container)).toBe(2);
    expect(photos(container)[0]).toHaveClass('opacity-0');
    expect(photos(container)[2]).not.toHaveClass('opacity-0');
    expect(dots().map((d) => d.getAttribute('aria-current'))).toEqual(['false', 'false', 'true']);
  });

  it('puts the photo frame on the page background token, not a hard-coded grey (AC4)', () => {
    const { container } = render(<ProductCard product={card({}, 2)} />);

    const frame = photos(container)[0].parentElement!;
    expect(frame).toHaveClass('aspect-[4/5]', 'bg-background');
    expect(frame.className).not.toMatch(/F9F9F9/i);
  });

  it('fits photos with contain or cover per imageFit (AC4)', () => {
    const { container, rerender } = render(<ProductCard product={card({ imageFit: 'contain' })} />);
    expect(photos(container)[0]).toHaveClass('object-contain');

    rerender(<ProductCard product={card({ imageFit: 'cover' })} />);
    expect(photos(container)[0]).toHaveClass('object-cover');
  });

  it('renders no wishlist heart unless both isFavorite and onToggleFavorite are passed (AC8)', () => {
    const { rerender } = render(<ProductCard product={card()} />);
    expect(screen.queryByRole('button', { name: /wishlist/i })).not.toBeInTheDocument();

    rerender(<ProductCard product={card()} isFavorite={false} />);
    expect(screen.queryByRole('button', { name: /wishlist/i })).not.toBeInTheDocument();

    rerender(<ProductCard product={card()} onToggleFavorite={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /wishlist/i })).not.toBeInTheDocument();
  });

  it('reflects isFavorite in aria-pressed and the label (AC8)', () => {
    const { rerender } = render(<ProductCard product={card()} isFavorite={false} onToggleFavorite={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Add to wishlist' })).toHaveAttribute('aria-pressed', 'false');

    rerender(<ProductCard product={card()} isFavorite onToggleFavorite={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove from wishlist' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onToggleFavorite with the slug and keeps no favorite state of its own (AC8)', () => {
    const onToggleFavorite = vi.fn();
    render(<ProductCard product={card()} isFavorite={false} onToggleFavorite={onToggleFavorite} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }));

    expect(onToggleFavorite).toHaveBeenCalledWith('tideline-6-0-performance-shortboard');
    // Controlled: the parent hasn't changed isFavorite, so the heart stays unpressed.
    expect(screen.getByRole('button', { name: 'Add to wishlist' })).toHaveAttribute('aria-pressed', 'false');
  });
});
