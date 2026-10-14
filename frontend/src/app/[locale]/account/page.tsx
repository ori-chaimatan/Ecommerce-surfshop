import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AccountPage } from '@/components/account';
import { getSession } from '@/lib/auth/session';
import { ACCOUNT_HREF, loginHref } from '@/lib/routes';
import { getMe } from '@/lib/strapi/account';
import { getOrders } from '@/lib/strapi/orders';
import { getWishlist } from '@/lib/strapi/wishlist';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'My Account — WESTLINE',
  robots: { index: false, follow: false },
};

/** My Account needs a session: guests sign in and come back here. */
export default async function AccountRoute() {
  const session = getSession();
  const account = session ? await getMe(session.jwt) : null;
  if (!account || !session) redirect(loginHref(ACCOUNT_HREF));

  // A Strapi failure shows an empty wishlist / order history rather than breaking the page.
  const [wishlist, orders] = await Promise.all([getWishlist(session.jwt), getOrders(session.jwt)]);
  return <AccountPage account={account} wishlist={wishlist ?? []} orders={orders ?? []} />;
}
