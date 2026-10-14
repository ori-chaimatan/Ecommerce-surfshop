import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { CheckoutPage } from '@/components/checkout';
import { getSession } from '@/lib/auth/session';
import { CHECKOUT_HREF, loginHref } from '@/lib/routes';
import { getMe } from '@/lib/strapi/account';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Checkout — WESTLINE',
  robots: { index: false, follow: false },
};

/** Checkout needs an account: guests sign in (their cart merges) and come back here. */
export default async function CheckoutRoute() {
  const session = getSession();
  const account = session ? await getMe(session.jwt) : null;
  if (!account) redirect(loginHref(CHECKOUT_HREF));

  return <CheckoutPage account={account} />;
}
