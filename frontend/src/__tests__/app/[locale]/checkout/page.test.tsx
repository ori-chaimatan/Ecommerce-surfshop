import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getMe: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/strapi/account', () => ({ getMe: mocks.getMe }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/components/checkout', () => ({ CheckoutPage: (props: object) => ({ type: 'CheckoutPage', props }) }));

import CheckoutRoute, { dynamic, metadata } from '@/app/[locale]/checkout/page';

describe('/checkout page (checkout AC9, AC17, AC21)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is dynamic, titled and not indexed', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(metadata).toMatchObject({ title: 'Checkout — WESTLINE', robots: { index: false, follow: false } });
  });

  it('sends a guest to sign in, returning to checkout', async () => {
    mocks.getSession.mockReturnValue(null);
    await expect(CheckoutRoute()).rejects.toThrow('redirect:/auth/login?next=%2Fcheckout');
  });

  it('sends a rejected session to sign in too', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getMe.mockResolvedValue(null);
    await expect(CheckoutRoute()).rejects.toThrow('redirect:/auth/login?next=%2Fcheckout');
  });

  it('renders checkout with the account for prefill', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getMe.mockResolvedValue({ email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' });

    const element = (await CheckoutRoute()) as { props: { account: object } };
    expect(mocks.getMe).toHaveBeenCalledWith('jwt-1');
    expect(element.props.account).toEqual({ email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' });
  });
});
