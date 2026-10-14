import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ORDER } from '../../../../components/checkout/checkout-fixtures';

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getOrder: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  notFound: vi.fn(() => {
    throw new Error('not-found');
  }),
}));
vi.mock('@/lib/auth/session', () => ({ getSession: mocks.getSession }));
vi.mock('@/lib/strapi/orders', () => ({ getOrder: mocks.getOrder }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect, notFound: mocks.notFound }));
vi.mock('@/components/checkout', () => ({ OrderConfirmation: (props: object) => ({ type: 'OrderConfirmation', props }) }));

import ConfirmationRoute, { dynamic, metadata } from '@/app/[locale]/checkout/confirmation/[orderNumber]/page';

const params = { locale: 'en', orderNumber: 'WL-104233' };

describe('/checkout/confirmation/[orderNumber] page (checkout AC8, AC15)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('is dynamic, titled and not indexed', () => {
    expect(dynamic).toBe('force-dynamic');
    expect(metadata).toMatchObject({ title: 'Order Confirmed — WESTLINE', robots: { index: false, follow: false } });
  });

  it('sends a guest to sign in, returning to this order', async () => {
    mocks.getSession.mockReturnValue(null);
    await expect(ConfirmationRoute({ params })).rejects.toThrow('redirect:/auth/login?next=%2Fcheckout%2Fconfirmation%2FWL-104233');
  });

  it('sends a rejected session to sign in', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getOrder.mockResolvedValue({ ok: false, status: 401 });
    await expect(ConfirmationRoute({ params })).rejects.toThrow('redirect:/auth/login');
  });

  it("answers 404 for an unknown order or someone else's", async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getOrder.mockResolvedValue({ ok: false, status: 404 });
    await expect(ConfirmationRoute({ params })).rejects.toThrow('not-found');
  });

  it('renders the stored snapshot', async () => {
    mocks.getSession.mockReturnValue({ jwt: 'jwt-1' });
    mocks.getOrder.mockResolvedValue({ ok: true, order: ORDER });

    const element = (await ConfirmationRoute({ params })) as { props: { order: { orderNumber: string; total: string } } };
    expect(mocks.getOrder).toHaveBeenCalledWith('jwt-1', 'WL-104233');
    expect(element.props.order).toMatchObject({ orderNumber: 'WL-104233', total: '$704.98' });
  });
});
