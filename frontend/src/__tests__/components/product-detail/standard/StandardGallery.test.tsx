import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { StandardGallery } from '@/components/product-detail/standard/StandardGallery';

// Deliberately different shapes, to prove the frame never follows the photo.
const IMAGES = [
  { src: 'http://localhost:1337/uploads/a.jpg', width: 700, height: 874 },
  { src: 'http://localhost:1337/uploads/b.jpg', width: 2000, height: 600 },
  { src: 'http://localhost:1337/uploads/c.jpg', width: 1200, height: 1200 },
];

function photoButtons() {
  return screen.getAllByRole('button', { name: /^Open photo/ });
}

function dialog() {
  return screen.getByRole('dialog', { name: 'Photo viewer' });
}

describe('StandardGallery grid (AC7, AC8)', () => {
  it('renders one labelled photo button per image, the first with priority', () => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);

    expect(photoButtons().map((button) => button.getAttribute('aria-label'))).toEqual([
      'Open photo 1 of 3',
      'Open photo 2 of 3',
      'Open photo 3 of 3',
    ]);
    const [first, second] = photoButtons().map((button) => within(button).getByRole('img', { name: 'Samurai' }));
    expect(first.getAttribute('src')).toContain('a.jpg');
    expect(first).not.toHaveAttribute('loading', 'lazy');
    expect(second).toHaveAttribute('loading', 'lazy');
  });

  it('puts every photo in the same fixed 4:5 frame on the page background, with object-contain', () => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);

    const frames = photoButtons().map((button) => {
      const image = within(button).getByRole('img');
      expect(button).toHaveClass('relative', 'aspect-[4/5]', 'bg-background');
      expect(button.getAttribute('style')).toBeNull();
      expect(image).toHaveClass('object-contain');
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
      return button.className;
    });
    expect(new Set(frames).size).toBe(1);
  });

  it('is a 2-up grid on desktop and a full-width scroll-snap swipe at ≤900px', () => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);

    const grid = photoButtons()[0].parentElement!;
    expect(grid).toHaveClass('grid', 'grid-cols-2', 'gap-[3px]');
    expect(grid).toHaveClass('max-[900px]:flex', 'max-[900px]:snap-x', 'max-[900px]:snap-mandatory', 'max-[900px]:overflow-x-auto');
    expect(photoButtons()[0]).toHaveClass('max-[900px]:flex-[0_0_100%]', 'max-[900px]:snap-center', 'max-[900px]:snap-always');
  });

  it('lets a single photo span both columns', () => {
    render(<StandardGallery images={IMAGES.slice(0, 1)} name="Samurai" />);

    expect(photoButtons()).toHaveLength(1);
    expect(photoButtons()[0]).toHaveClass('col-span-2');
  });
});

describe('StandardGallery lightbox (AC9)', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('is closed until a photo is clicked', () => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens at the clicked photo and navigates from there', () => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);

    fireEvent.click(photoButtons()[2]);

    expect(within(dialog()).getByText('3 / 3')).toBeInTheDocument();
    expect(within(dialog()).getByRole('img').getAttribute('src')).toContain('c.jpg');
    expect(within(dialog()).getByRole('button', { name: 'Close photo viewer' })).toHaveFocus();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(within(dialog()).getByText('1 / 3')).toBeInTheDocument();
  });

  it.each([
    ['the close button', () => fireEvent.click(within(dialog()).getByRole('button', { name: 'Close photo viewer' }))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['a backdrop click', () => fireEvent.click(dialog())],
  ])('closes on %s and returns focus to the photo it was opened from', (_, close) => {
    render(<StandardGallery images={IMAGES} name="Samurai" />);
    fireEvent.click(photoButtons()[1]);

    close();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(photoButtons()[1]).toHaveFocus();
  });
});
