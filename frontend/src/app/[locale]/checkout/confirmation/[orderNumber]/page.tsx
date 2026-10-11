import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { OrderConfirmation } from '@/components/checkout';
import { toOrderView } from '@/components/checkout/checkout';
import { getSession } from '@/lib/auth/session';
import { loginHref, orderConfirmationHref } from '@/lib/routes';
import { getOrder } from '@/lib/strapi/orders';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Order Confirmed — WESTLINE',
  robots: { index: false, follow: false },
};

/** Only the order's owner sees it; unknown and someone else's orders are the same 404. */
export default async function ConfirmationRoute({ params }: { params: { orderNumber: string } }) {
  const back = loginHref(orderConfirmationHref(params.orderNumber));
  const session = getSession();
  if (!session) redirect(back);

  const result = await getOrder(session.jwt, params.orderNumber);
  if (!result.ok && result.status === 401) redirect(back);
  if (!result.ok) notFound();

  return <OrderConfirmation order={toOrderView(result.order)} />;
}
