'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { useCart } from '@/components/cart/cart-context';
import { toPlaceOrderBody, type CheckoutFormValues } from '@/lib/checkout/place-order-body';
import { clearCheckout, getIdempotencyKey, loadShippingDraft, saveShippingDraft } from '@/lib/checkout/storage';
import {
  CHECKOUT_FIELDS,
  formatCardNumber,
  formatExpiry,
  validatePlaceOrderBody,
  type CheckoutField,
  type FieldErrors,
} from '@/lib/checkout/validate';
import { CHECKOUT_API_HREF, CHECKOUT_HREF, loginHref } from '@/lib/routes';
import type { Me } from '@/lib/strapi/account';
import { texts } from './checkout-texts';

const BLANK: CheckoutFormValues = {
  firstName: '',
  lastName: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
  shippingMethod: 'standard',
  cardNumber: '',
  cardExpiry: '',
  cardCvc: '',
  cardName: '',
};

const CARD_FIELDS = new Set<CheckoutField>(['cardNumber', 'cardExpiry', 'cardCvc', 'cardName']);

/** Card inputs are formatted as typed; everything else is kept as entered. */
function formatField(field: CheckoutField, value: string) {
  if (field === 'cardNumber') return formatCardNumber(value);
  if (field === 'cardExpiry') return formatExpiry(value);
  if (field === 'cardCvc') return value.replace(/\D/g, '').slice(0, 4);
  return value;
}

const ERROR_MESSAGES: Record<string, string> = {
  'card-declined': texts.declined,
  'payment-error': texts.paymentError,
  'cart-changed': texts.cartChanged,
  'cart-empty': texts.cartEmpty,
  'rate-limited': texts.rateLimited,
};

/** Only the form's own fields, in form order (server errors may carry others). */
const formErrors = (fields: FieldErrors) =>
  Object.fromEntries(CHECKOUT_FIELDS.filter((field) => fields[field]).map((field) => [field, fields[field]])) as FieldErrors;

/**
 * Checkout state and submission: the form values (prefilled from the account and the saved
 * draft), inline errors with focus on the first one, and Place Order — one idempotency key per
 * attempt, one request at a time, and every server answer mapped to the form.
 */
export function usePlaceOrder(account: Me) {
  const router = useRouter();
  const { cart, reload } = useCart();
  const [values, setValues] = useState<CheckoutFormValues>(() => ({
    ...BLANK,
    firstName: account.firstName,
    lastName: account.lastName,
    ...loadShippingDraft(),
  }));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ message: string; id: number } | null>(null);
  const [changedKeys, setChangedKeys] = useState<ReadonlySet<string>>(new Set());
  const [placed, setPlaced] = useState(false);

  const pending = useRef(false);
  const fields = useRef<Partial<Record<CheckoutField, HTMLElement | null>>>({});
  const alertRef = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (alert) alertRef.current?.focus();
  }, [alert]);

  const fieldRef = useCallback(
    (field: CheckoutField) => (element: HTMLElement | null) => {
      fields.current[field] = element;
    },
    []
  );

  const setField = useCallback((field: CheckoutField, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: formatField(field, value) };
      if (!CARD_FIELDS.has(field)) saveShippingDraft(next);
      return next;
    });
    setErrors((current) => {
      if (!current[field]) return current;
      const rest = { ...current };
      delete rest[field];
      return rest;
    });
  }, []);

  const showErrors = (found: FieldErrors) => {
    const visible = formErrors(found);
    setErrors(visible);
    const first = CHECKOUT_FIELDS.find((field) => visible[field]);
    if (first) fields.current[first]?.focus();
    return first !== undefined;
  };

  const showAlert = (message: string) => setAlert({ message, id: Date.now() });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending.current) return;

    const body = toPlaceOrderBody(values, cart, getIdempotencyKey());
    const checked = validatePlaceOrderBody(body, new Date());
    if (!checked.ok) {
      if (!showErrors(checked.fields)) showAlert(texts.failed);
      return;
    }

    pending.current = true;
    setSubmitting(true);
    setErrors({});
    setAlert(null);
    try {
      const response = await fetch(CHECKOUT_API_HREF, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checked.body),
      });
      const data = await response.json().catch(() => null);

      if (response.ok && typeof data?.href === 'string') {
        // Navigate before the cart reload empties it, so the page doesn't bounce to /cart.
        // A push keeps /checkout in history: Back lands there and, the cart now empty, on /cart.
        setPlaced(true);
        clearCheckout();
        router.push(data.href);
        void reload();
        return;
      }

      const code: string | undefined = data?.error?.code;
      if (response.status === 401) {
        router.push(loginHref(CHECKOUT_HREF));
        return;
      }
      if (code === 'bad-request' && data?.error?.fields && showErrors(data.error.fields)) return;
      if (code === 'cart-changed' || code === 'cart-empty') {
        setChangedKeys(new Set<string>(Array.isArray(data?.error?.lineKeys) ? data.error.lineKeys : []));
        void reload();
      }
      showAlert(ERROR_MESSAGES[code ?? ''] ?? texts.failed);
    } catch {
      showAlert(texts.failed);
    } finally {
      pending.current = false;
      setSubmitting(false);
    }
  }

  return {
    values,
    errors,
    setField,
    submit,
    submitting,
    alert: alert?.message ?? null,
    alertRef,
    fieldRef,
    changedKeys,
    placed,
  };
}
