'use client';

import { useState } from 'react';
import { useCart } from '@/components/cart/cart-context';
import { texts } from '../product-detail-texts';

/**
 * Add to Cart for a buy panel: adds one of the given size, tracks the in-flight request
 * and the message to show when it fails. The cart drawer opens on success.
 */
export function useAddToCart(documentId: string) {
  const { add } = useCart();
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function addSize(sizeKey: string) {
    setAdding(true);
    setMessage(null);
    const result = await add(documentId, sizeKey);
    setAdding(false);
    if (result === 'sold-out') setMessage(texts.addSoldOut);
    else if (result === 'error') setMessage(texts.addFailed);
  }

  return { adding, message, addSize, clearMessage: () => setMessage(null) };
}
