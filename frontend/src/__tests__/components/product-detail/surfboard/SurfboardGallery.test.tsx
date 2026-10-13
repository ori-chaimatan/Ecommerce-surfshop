import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { SurfboardGallery } from '@/components/product-detail/surfboard/SurfboardGallery';

// Deliberately different shapes: a tall board, a wide detail shot, a square.
const IMAGES = [
  { src: 'http://localhost:1337/uploads/a.jpg', width: 530, height: 2000 },
  { src: 'http://localhost:1337/uploads/b.jpg', width: 2000, height: 167 },
  { src: 'http://localhost:1337/uploads/c.jpg', width: 1200, height: 1200 },
];

const FRAME_CLASSES = ['relative', 'h-[74vh]', 'w-full', 'bg-background'];

function mainButton() {
  return screen.getByRole('button', { name: /^Open photo/ });
}

function dialog() {
  return screen.getByRole('dialog', { name: 'Photo viewer' });
}

describe('SurfboardGallery (AC7)', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('shows the first photo with priority and prev/next buttons', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);

    expect(mainButton()).toHaveAccessibleName('Open photo 1 of 3');
    const image = within(mainButton()).getByRole('img', { name: 'Tideline' });
    expect(image.getAttribute('src')).toContain('a.jpg');
    expect(image).not.toHaveAttribute('loading', 'lazy');
    expect(screen.getByRole('button', { name: 'Previous photo' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next photo' })).toBeInTheDocument();
  });

  it('wraps around in both directions', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);

    fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }));
    expect(mainButton()).toHaveAccessibleName('Open photo 3 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(mainButton()).toHaveAccessibleName('Open photo 1 of 3');
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    expect(mainButton()).toHaveAccessibleName('Open photo 2 of 3');
  });

  it('has no prev/next with a single photo', () => {
    render(<SurfboardGallery images={IMAGES.slice(0, 1)} name="Tideline" />);

    expect(screen.queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    expect(mainButton()).toHaveAccessibleName('Open photo 1 of 1');
  });
});

describe('SurfboardGallery frame (AC7)', () => {
  it('keeps one fixed frame, independent of the photo, and fills it with object-contain', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    const snapshots: string[] = [];

    for (let i = 0; i < IMAGES.length; i++) {
      const frame = mainButton();
      const image = within(frame).getByRole('img');
      expect(frame).toHaveClass(...FRAME_CLASSES);
      expect(frame.getAttribute('style')).toBeNull();
      expect(frame.className).not.toMatch(/F9F9F9/i);
      expect(image).toHaveClass('object-contain');
      expect(image).not.toHaveAttribute('width');
      expect(image).not.toHaveAttribute('height');
      snapshots.push(frame.className);
      fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    }

    expect(new Set(snapshots).size).toBe(1);
  });

  it('keeps the lightbox stage fixed and on the page background', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    fireEvent.click(mainButton());
    const stages: string[] = [];

    for (let i = 0; i < IMAGES.length; i++) {
      const image = within(dialog()).getByRole('img');
      const stage = image.parentElement!;
      expect(stage).toHaveClass('h-[min(78vh,860px)]', 'w-[min(88vw,860px)]');
      expect(image).toHaveClass('object-contain', 'bg-background');
      expect(image.className).not.toMatch(/F9F9F9/i);
      stages.push(stage.className);
      fireEvent.keyDown(document, { key: 'ArrowRight' });
    }

    expect(new Set(stages).size).toBe(1);
  });
});

describe('SurfboardGallery lightbox (AC8)', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('is closed until the main photo is clicked', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the current photo as a modal dialog, locks scroll and focuses close', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    fireEvent.click(screen.getByRole('button', { name: 'Next photo' }));
    fireEvent.click(mainButton());

    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog()).getByText('2 / 3')).toBeInTheDocument();
    expect(within(dialog()).getByRole('img').getAttribute('src')).toContain('b.jpg');
    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog()).getByRole('button', { name: 'Close photo viewer' })).toHaveFocus();
  });

  it('navigates with its arrows and the arrow keys, wrapping, and keeps the main photo in sync', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    fireEvent.click(mainButton());

    fireEvent.click(within(dialog()).getByRole('button', { name: 'Previous photo' }));
    expect(within(dialog()).getByText('3 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(within(dialog()).getByText('1 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(within(dialog()).getByText('2 / 3')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(within(dialog()).getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Next photo' }));

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(mainButton()).toHaveAccessibleName('Open photo 2 of 3');
  });

  it.each([
    ['the close button', () => fireEvent.click(within(dialog()).getByRole('button', { name: 'Close photo viewer' }))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['a backdrop click', () => fireEvent.click(dialog())],
  ])('closes on %s, unlocks scroll and returns focus to the main photo', (_, close) => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    fireEvent.click(mainButton());

    close();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
    expect(mainButton()).toHaveFocus();
  });

  it('does not close when the photo itself is clicked', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);
    fireEvent.click(mainButton());

    fireEvent.click(within(dialog()).getByRole('img'));

    expect(dialog()).toBeInTheDocument();
  });

  it('ignores arrow keys while closed', () => {
    render(<SurfboardGallery images={IMAGES} name="Tideline" />);

    fireEvent.keyDown(document, { key: 'ArrowRight' });

    expect(mainButton()).toHaveAccessibleName('Open photo 1 of 3');
  });

  it('hides the arrows and the counter with a single photo', () => {
    render(<SurfboardGallery images={IMAGES.slice(0, 1)} name="Tideline" />);
    fireEvent.click(mainButton());

    expect(within(dialog()).queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    expect(within(dialog()).queryByText('1 / 1')).not.toBeInTheDocument();
  });
});
