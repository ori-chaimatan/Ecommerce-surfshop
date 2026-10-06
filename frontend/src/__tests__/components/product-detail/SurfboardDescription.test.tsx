import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SurfboardDescription } from '@/components/product-detail/SurfboardDescription';

/** jsdom has no layout, so fake the clamped box's heights to say whether the text overflows 6 lines. */
function stubOverflow(overflows: boolean) {
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockReturnValue(overflows ? 300 : 100);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(100);
}

describe('SurfboardDescription (AC9)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the markdown under a "From the shaper" eyebrow', () => {
    stubOverflow(false);
    render(<SurfboardDescription markdown={'> "Fast and **loose**."\n\n- Thruster\n- Squash tail'} />);

    expect(screen.getByText('From the shaper')).toBeInTheDocument();
    expect(screen.getByText('loose').tagName).toBe('STRONG');
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('blockquote')).not.toBeNull();
  });

  it('does not render raw HTML', () => {
    stubOverflow(false);
    render(<SurfboardDescription markdown={'Hi <img src="x" onerror="alert(1)"> <script>alert(1)</script>'} />);

    expect(document.querySelector('img')).toBeNull();
    expect(document.querySelector('script')).toBeNull();
  });

  it('has no toggle when the text fits in 6 lines', () => {
    stubOverflow(false);
    render(<SurfboardDescription markdown="Short." />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('toggles Read more / Read less with aria-expanded when the text overflows', () => {
    stubOverflow(true);
    render(<SurfboardDescription markdown="Long text." />);

    const toggle = screen.getByRole('button', { name: 'Read more' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Read less' })).toHaveAttribute('aria-expanded', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Read less' }));
    expect(screen.getByRole('button', { name: 'Read more' })).toHaveAttribute('aria-expanded', 'false');
  });
});
