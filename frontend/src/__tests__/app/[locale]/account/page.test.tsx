import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getMe: vi.fn(),
  getWishlist: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/strapi/account', () => ({ getMe: mocks.getMe }));
vi.mock('@/lib/strapi/wishlist', () => ({ getWishlist: mocks.getWishlist }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/components/account', () => ({ AccountPage: (props: object) => ({ type: 'AccountPage', props }) }));

import AccountRoute, { dynamic, metadata } from '@/app/[locale]/account/page';

describe('/account page (account-profile AC1, AC2)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is dynamic, titled and not indexed', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(metadata).toMatchObject({ title: 'My Account — WESTLINE', robots: { index: false, follow: false } });
  });

  it('sends a guest to sign in, returning to My Account', async () => {
    mocks.getSession.mockReturnValue(null);
    await expect(AccountRoute()).rejects.toThrow('redirect:/auth/login?next=%2Faccount');
    expect(mocks.getMe).not.toHaveBeenCalled();
  });

  it('sends a rejected session to sign in too', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getMe.mockResolvedValue(null);
    await expect(AccountRoute()).rejects.toThrow('redirect:/auth/login?next=%2Faccount');
  });

  it('renders the account page for the signed-in shopper', async () => {
    const account = { email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' };
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getMe.mockResolvedValue(account);

    mocks.getWishlist.mockResolvedValue([{ slug: 'samurai' }]);

    const element = (await AccountRoute()) as { props: { account: object; wishlist: object[] } };
    expect(mocks.getMe).toHaveBeenCalledWith('jwt-1');
    expect(element.props.account).toEqual(account);
    expect(mocks.getWishlist).toHaveBeenCalledWith('jwt-1');
    expect(element.props.wishlist).toEqual([{ slug: 'samurai' }]);
  });

  it('renders an empty wishlist when Strapi fails to return it (wishlist AC5)', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getMe.mockResolvedValue({ email: 'jamie@example.com', firstName: 'Jamie', lastName: 'Rivera' });
    mocks.getWishlist.mockResolvedValue(null);

    const element = (await AccountRoute()) as { props: { wishlist: object[] } };
    expect(element.props.wishlist).toEqual([]);
  });
});
