import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StandardAccordions } from '@/components/product-detail/standard/StandardAccordions';

function header(name: string) {
  return screen.getByRole('button', { name });
}

function panel(name: string) {
  return document.getElementById(header(name).getAttribute('aria-controls')!)!;
}

describe('StandardAccordions (AC15)', () => {
  it('opens Description by default and keeps Shipping & Returns closed', () => {
    render(<StandardAccordions markdown="Built for **long sessions**." />);

    expect(header('Description')).toHaveAttribute('aria-expanded', 'true');
    expect(header('Shipping & Returns')).toHaveAttribute('aria-expanded', 'false');
    expect(panel('Description')).toBeVisible();
    expect(panel('Shipping & Returns')).not.toBeVisible();
  });

  it('renders the description markdown without raw HTML', () => {
    render(<StandardAccordions markdown={'Built for **long sessions**.\n\n- Fabric: stretch\n\n<img src="x" onerror="alert(1)">'} />);

    expect(screen.getByText('long sessions').tagName).toBe('STRONG');
    expect(screen.getByRole('listitem')).toHaveTextContent('Fabric: stretch');
    expect(document.querySelector('img')).toBeNull();
  });

  it('keeps one open at a time', () => {
    render(<StandardAccordions markdown="Text." />);

    fireEvent.click(header('Shipping & Returns'));

    expect(header('Shipping & Returns')).toHaveAttribute('aria-expanded', 'true');
    expect(header('Description')).toHaveAttribute('aria-expanded', 'false');
    expect(panel('Shipping & Returns')).toBeVisible();
    expect(panel('Shipping & Returns')).toHaveTextContent('Free shipping on orders over $75.');
    expect(panel('Shipping & Returns')).toHaveTextContent('30-day returns.');
    expect(panel('Description')).not.toBeVisible();
  });

  it('closes the open one when its header is clicked again', () => {
    render(<StandardAccordions markdown="Text." />);

    fireEvent.click(header('Description'));

    expect(header('Description')).toHaveAttribute('aria-expanded', 'false');
    expect(header('Shipping & Returns')).toHaveAttribute('aria-expanded', 'false');
  });

  it('rotates the open chevron 180°', () => {
    render(<StandardAccordions markdown="Text." />);

    expect(header('Description').querySelector('svg')).toHaveClass('rotate-180');
    expect(header('Shipping & Returns').querySelector('svg')).not.toHaveClass('rotate-180');
  });
});
