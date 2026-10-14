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

    const element = (await AccountRoute()) as { props: { account: object } };
    expect(mocks.getMe).toHaveBeenCalledWith('jwt-1');
    expect(element.props.account).toEqual(account);
  });
});
