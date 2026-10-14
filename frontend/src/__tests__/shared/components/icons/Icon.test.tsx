import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '@/shared/components/icons';

describe('Icon', () => {
  it('renders a decorative 24×24 svg with caller props', () => {
    const { container } = render(<Icon name="cart" width="20" stroke="currentColor" />);
    const svg = container.querySelector('svg')!;
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('aria-hidden');
    expect(svg).toHaveAttribute('width', '20');
  });

  it('has plus and minus shapes for the cart quantity stepper (add-to-cart AC14)', () => {
    const plus = render(<Icon name="plus" />).container.querySelector('path');
    const minus = render(<Icon name="minus" />).container.querySelector('path');
    expect(plus).toHaveAttribute('d', 'M12 5v14M5 12h14');
    expect(minus).toHaveAttribute('d', 'M5 12h14');
  });

  it('has a check shape for the order confirmation (checkout AC15)', () => {
    const check = render(<Icon name="check" />).container.querySelector('path');
    expect(check).toHaveAttribute('d', 'M5 12.5l4.5 4.5L19 7.5');
  });
});
