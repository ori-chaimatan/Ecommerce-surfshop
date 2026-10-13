import { fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PhotoLightbox } from '@/components/product-detail/shared/PhotoLightbox';

const IMAGES = [
  { src: 'http://localhost:1337/uploads/a.jpg', width: 700, height: 874 },
  { src: 'http://localhost:1337/uploads/b.jpg', width: 700, height: 874 },
  { src: 'http://localhost:1337/uploads/c.jpg', width: 700, height: 874 },
];

function renderLightbox(index = 0, images = IMAGES) {
  const onIndexChange = vi.fn();
  const onClose = vi.fn();
  const view = render(
    <PhotoLightbox images={images} name="Samurai" index={index} onIndexChange={onIndexChange} onClose={onClose} />,
  );
  return { ...view, onIndexChange, onClose };
}

function dialog() {
  return screen.getByRole('dialog', { name: 'Photo viewer' });
}

describe('PhotoLightbox (AC9)', () => {
  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('is a modal dialog showing the current photo and its counter in a fixed stage', () => {
    renderLightbox(1);

    expect(dialog()).toHaveAttribute('aria-modal', 'true');
    const image = within(dialog()).getByRole('img', { name: 'Samurai' });
    expect(image.getAttribute('src')).toContain('b.jpg');
    expect(image).toHaveClass('object-contain', 'bg-background');
    expect(image.parentElement).toHaveClass('h-[min(78vh,860px)]', 'w-[min(88vw,860px)]');
    expect(within(dialog()).getByText('2 / 3')).toBeInTheDocument();
  });

  it('locks body scroll and focuses the close button while open, and unlocks on unmount', () => {
    const { unmount } = renderLightbox();

    expect(document.body.style.overflow).toBe('hidden');
    expect(within(dialog()).getByRole('button', { name: 'Close photo viewer' })).toHaveFocus();
    unmount();
    expect(document.body.style.overflow).toBe('');
  });

  it('traps Tab inside the dialog: past the last button back to the first, and Shift+Tab the other way', () => {
    renderLightbox(0);
    const close = within(dialog()).getByRole('button', { name: 'Close photo viewer' });
    const next = within(dialog()).getByRole('button', { name: 'Next photo' });

    next.focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();

    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(next).toHaveFocus();

    // Focus that somehow left the dialog is pulled back in.
    (document.activeElement as HTMLElement).blur();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(close).toHaveFocus();
  });

  it('lets Tab move normally between buttons inside the dialog', () => {
    renderLightbox(0);
    const close = within(dialog()).getByRole('button', { name: 'Close photo viewer' });

    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    close.focus();
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('steps with its arrows and the arrow keys, wrapping around', () => {
    const { onIndexChange } = renderLightbox(0);

    fireEvent.click(within(dialog()).getByRole('button', { name: 'Previous photo' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Next photo' }));
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
    fireEvent.keyDown(document, { key: 'ArrowLeft' });
    expect(onIndexChange).toHaveBeenLastCalledWith(2);
    fireEvent.keyDown(document, { key: 'ArrowRight' });
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it.each([
    ['the close button', () => fireEvent.click(within(dialog()).getByRole('button', { name: 'Close photo viewer' }))],
    ['Escape', () => fireEvent.keyDown(document, { key: 'Escape' })],
    ['a backdrop click', () => fireEvent.click(dialog())],
  ])('asks to close on %s', (_, close) => {
    const { onClose } = renderLightbox();

    close();

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when the photo itself is clicked', () => {
    const { onClose } = renderLightbox();

    fireEvent.click(within(dialog()).getByRole('img'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('hides the arrows and the counter with a single photo', () => {
    renderLightbox(0, IMAGES.slice(0, 1));

    expect(within(dialog()).queryByRole('button', { name: 'Previous photo' })).not.toBeInTheDocument();
    expect(within(dialog()).queryByRole('button', { name: 'Next photo' })).not.toBeInTheDocument();
    expect(within(dialog()).queryByText('1 / 1')).not.toBeInTheDocument();
  });
});
