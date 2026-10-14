import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AccountPage } from '@/components/account';
import { inWishlist } from '../wishlist/wishlist-test-utils';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => router }));

const ACCOUNT = { firstName: 'Jamie', lastName: 'Rivera', email: 'jamie@example.com' };
const mockFetch = vi.fn();

describe('AccountPage (account-profile AC2, AC4, AC8, AC14)', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/account');
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('shows the breadcrumb, heading and welcome line (AC2)', () => {
    render(inWishlist(<AccountPage account={ACCOUNT} wishlist={[]} orders={[]} />));

    const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(breadcrumb).toHaveTextContent('Home/My Account');
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('heading', { level: 1, name: 'My Account' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back, Jamie Rivera.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign Out' })).toBeInTheDocument();
  });

  it('greets a shopper without a name without a dangling comma', () => {
    render(inWishlist(<AccountPage account={{ ...ACCOUNT, firstName: '', lastName: '' }} wishlist={[]} orders={[]} />));
    expect(screen.getByText('Welcome back.')).toBeInTheDocument();
  });

  it('has two tabs with exactly one active panel, switched by clicking (AC4)', () => {
    render(inWishlist(<AccountPage account={ACCOUNT} wishlist={[]} orders={[]} />));
    const overview = screen.getByRole('tab', { name: 'My Account' });
    const details = screen.getByRole('tab', { name: 'Account Details' });

    expect(overview).toHaveAttribute('aria-selected', 'true');
    expect(details).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('My Account');
    expect(screen.getByRole('heading', { name: 'Wishlist' })).toBeVisible();

    fireEvent.click(details);
    expect(details).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Account Details');
    expect(screen.getByLabelText('First name')).toBeVisible();
    expect(window.location.hash).toBe('#details');
  });

  it('updates the welcome line after a successful save (AC8)', async () => {
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ profile: { ...ACCOUNT, firstName: 'Jo', lastName: 'Reyes' } }), { status: 200 })
    );
    render(inWishlist(<AccountPage account={ACCOUNT} wishlist={[]} orders={[]} />));
    fireEvent.click(screen.getByRole('tab', { name: 'Account Details' }));
    fireEvent.change(screen.getByLabelText('First name'), { target: { value: 'Jo' } });
    fireEvent.change(screen.getByLabelText('Last name'), { target: { value: 'Reyes' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /save changes/i }));
    });

    expect(screen.getByText('Welcome back, Jo Reyes.')).toBeInTheDocument();
  });

  it('renders no footer of its own: the site footer comes from the layout (AC14 superseded by site-footer AC7)', () => {
    render(inWishlist(<AccountPage account={ACCOUNT} wishlist={[]} orders={[]} />));
    expect(screen.queryByRole('contentinfo')).toBeNull();
  });
});
