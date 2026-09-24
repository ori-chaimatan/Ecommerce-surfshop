import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import LoginPage from './page';

describe('LoginPage', () => {
  it('links "Forgot your password?" to /forgot-password (AC10)', () => {
    render(<LoginPage />);

    const link = screen.getByText(/forgot your password/i);
    expect(link).toHaveAttribute('href', '/forgot-password');
  });
});
