import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}));

import SignupPage from './page';

describe('SignupPage', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockRefresh.mockClear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('shows an inline error and does not call the API when the password is under 8 characters (AC3)', async () => {
    render(<SignupPage />);

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Jamie' } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: 'Rivera' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'jamie@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'short' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/8 characters/i);
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
