import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ShippingProgress } from '@/components/cart/ShippingProgress';

describe('ShippingProgress (AC13)', () => {
  it('shows how much more is needed and the progress below the threshold', () => {
    const { container } = render(<ShippingProgress remaining="$50" progress={1 / 3} variant="page" />);
    expect(container.firstElementChild).toHaveClass('bg-surface', 'rounded-[9px]');

    expect(screen.getByText('Add $50 more for free shipping.')).toBeInTheDocument();
    const bar = screen.getByRole('progressbar', { name: 'Progress to free shipping' });
    expect(bar).toHaveAttribute('aria-valuenow', '33');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveClass('h-[5px]', 'bg-border');
    expect(bar.firstElementChild).toHaveStyle({ width: '33%' });
    expect(bar.firstElementChild).toHaveClass('bg-horizon');
  });

  it('celebrates once free shipping is unlocked', () => {
    render(<ShippingProgress remaining={null} progress={1} variant="drawer" />);

    expect(screen.getByText("You've unlocked free shipping!")).toBeInTheDocument();
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect(bar).toHaveClass('h-1');
  });
});
