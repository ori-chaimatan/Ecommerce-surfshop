import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import SignupPage from '@/app/[locale]/auth/register/page';

describe('SignupPage ?next= (checkout AC17)', () => {
  beforeEach(() => {
    router.push.mockReset();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ user: {} }), { status: 200 })));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns to a safe next path after creating the account', async () => {
    render(<SignupPage searchParams={{ next: '/checkout' }} />);
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Jamie' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Rivera' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/checkout'));
  });

  it('keeps next on "Sign in" and on Google sign-in', () => {
    render(<SignupPage searchParams={{ next: '/checkout' }} />);
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/auth/login?next=%2Fcheckout');
    expect(screen.getByRole('link', { name: /continue with google/i })).toHaveAttribute('href', '/api/auth/google?next=%2Fcheckout');
  });
});
