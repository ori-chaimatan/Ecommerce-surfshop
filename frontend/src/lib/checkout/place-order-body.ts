import { shippingCost, type ShippingMethod } from '@/lib/shipping';
import { parseExpiry, type PlaceOrderBody } from './validate';

export interface CheckoutFormValues {
  firstName: string;
  lastName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  shippingMethod: ShippingMethod;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  cardName: string;
}

export interface ReviewedCart {
  lines: { productDocumentId: string; sizeKey: string; quantity: number; unitAmount: number }[];
  subtotalAmount: number;
}

const cents = (amount: number) => Math.round(amount * 100);

/**
 * The place-order body: the form plus what the shopper reviewed (`expected`), so the server
 * can refuse to charge anything different.
 */
export function toPlaceOrderBody(form: CheckoutFormValues, cart: ReviewedCart, idempotencyKey: string): PlaceOrderBody {
  const expiry = parseExpiry(form.cardExpiry);
  const total = cents(cart.subtotalAmount) + cents(shippingCost(cart.subtotalAmount, form.shippingMethod));

  return {
    idempotencyKey,
    shipping: {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      address1: form.address1.trim(),
      address2: form.address2.trim(),
      city: form.city.trim(),
      state: form.state,
      postalCode: form.postalCode.trim(),
      phone: form.phone.trim(),
    },
    shippingMethod: form.shippingMethod,
    card: {
      number: form.cardNumber.replace(/\D/g, ''),
      expMonth: expiry?.expMonth ?? NaN,
      expYear: expiry?.expYear ?? NaN,
      cvc: form.cardCvc.trim(),
      name: form.cardName.trim(),
    },
    expected: {
      total: total / 100,
      lines: cart.lines.map(({ productDocumentId, sizeKey, quantity, unitAmount }) => ({
        productDocumentId,
        sizeKey,
        quantity,
        unitPrice: unitAmount,
      })),
    },
  };
}
