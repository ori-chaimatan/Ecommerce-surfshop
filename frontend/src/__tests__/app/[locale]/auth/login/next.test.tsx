import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

import LoginPage from '@/app/[locale]/auth/login/page';

const ok = () => new Response(JSON.stringify({ user: {} }), { status: 200 });

async function signIn() {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'jamie@example.com' } });
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
  fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
  await waitFor(() => expect(router.push).toHaveBeenCalled());
}

describe('LoginPage ?next= (checkout AC17)', () => {
  beforeEach(() => {
    router.push.mockReset();
    vi.stubGlobal('fetch', vi.fn(async () => ok()));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('returns to a safe next path after signing in', async () => {
    render(<LoginPage searchParams={{ next: '/checkout' }} />);
    await signIn();
    expect(router.push).toHaveBeenCalledWith('/checkout');
  });

  it('goes home for an unsafe next', async () => {
    render(<LoginPage searchParams={{ next: '//evil.com' }} />);
    await signIn();
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('goes home without next, as before', async () => {
    render(<LoginPage />);
    await signIn();
    expect(router.push).toHaveBeenCalledWith('/');
  });

  it('keeps next on "Create an account" and on Google sign-in', () => {
    render(<LoginPage searchParams={{ next: '/checkout' }} />);
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/auth/register?next=%2Fcheckout');
    expect(screen.getByRole('link', { name: /continue with google/i })).toHaveAttribute('href', '/api/auth/google?next=%2Fcheckout');
  });

  it('leaves the links unchanged without next', () => {
    render(<LoginPage />);
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/auth/register');
    expect(screen.getByRole('link', { name: /continue with google/i }).getAttribute('href')).toMatch(/\/api\/connect\/google$/);
  });
});
