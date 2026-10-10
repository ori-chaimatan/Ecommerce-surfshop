import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/CartPage';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Your Cart — WESTLINE',
  robots: { index: false, follow: false },
};

export default function CartRoute() {
  return <CartPage />;
}
