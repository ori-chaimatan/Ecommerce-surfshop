import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SignOutButton } from '@/components/account/SignOutButton';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const mockFetch = vi.fn();

describe('SignOutButton (account-profile AC3)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
    vi.clearAllMocks();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows "Signing out…" and disables itself while the logout runs, then goes Home signed out', async () => {
    let resolve: (response: Response) => void = () => {};
    mockFetch.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    render(<SignOutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    });
    expect(screen.getByRole('button', { name: 'Signing out…' })).toBeDisabled();
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/logout', { method: 'POST' });

    await act(async () => resolve(new Response(null, { status: 200 })));
    expect(router.push).toHaveBeenCalledWith('/');
    expect(router.refresh).toHaveBeenCalled();
  });

  it('re-enables itself when the logout request fails', async () => {
    mockFetch.mockRejectedValue(new Error('offline'));
    render(<SignOutButton />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Sign Out' }));
    });

    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeEnabled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
