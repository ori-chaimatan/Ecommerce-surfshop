/**
 * Per-tab checkout state in sessionStorage: the shipping draft (so a refresh keeps it) and the
 * idempotency key for the current attempt. Card fields are never stored. Every access is
 * guarded — storage can be unavailable (private mode, blocked site data) and checkout must
 * still work, keeping the key in memory for the page's lifetime.
 */
import { isShippingMethod, type ShippingMethod } from '@/lib/shipping';
import type { ShippingAddress } from './validate';

export const CHECKOUT_STORAGE = 'westline_checkout';
export const CHECKOUT_KEY_STORAGE = 'westline_checkout_key';

export type ShippingDraft = ShippingAddress & { shippingMethod: ShippingMethod };

const DRAFT_FIELDS = ['firstName', 'lastName', 'address1', 'address2', 'city', 'state', 'postalCode', 'phone'] as const;

let memoryKey: string | null = null;

function read(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    // Storage unavailable: the draft just won't survive a refresh.
  }
}

export function saveShippingDraft(draft: ShippingDraft) {
  const safe: Partial<ShippingDraft> = { shippingMethod: draft.shippingMethod };
  for (const field of DRAFT_FIELDS) safe[field] = draft[field];
  write(CHECKOUT_STORAGE, JSON.stringify(safe));
}

/** The stored draft's valid fields only; null when nothing (readable) is stored. */
export function loadShippingDraft(): Partial<ShippingDraft> | null {
  const stored = read(CHECKOUT_STORAGE);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored) as Record<string, unknown>;
    const draft: Partial<ShippingDraft> = {};
    for (const field of DRAFT_FIELDS) if (typeof parsed[field] === 'string') draft[field] = parsed[field] as string;
    if (isShippingMethod(parsed.shippingMethod)) draft.shippingMethod = parsed.shippingMethod;
    return draft;
  } catch {
    return null;
  }
}

/** One key per checkout attempt: retries after a decline reuse it, so a double submit can't place two orders. */
export function getIdempotencyKey(): string {
  const stored = read(CHECKOUT_KEY_STORAGE);
  if (stored) return stored;
  if (!memoryKey) memoryKey = crypto.randomUUID();
  write(CHECKOUT_KEY_STORAGE, memoryKey);
  return read(CHECKOUT_KEY_STORAGE) ?? memoryKey;
}

export function rotateIdempotencyKey() {
  memoryKey = null;
  write(CHECKOUT_KEY_STORAGE, null);
}

/** After a placed order: forget the draft and start the next checkout with a fresh key. */
export function clearCheckout() {
  write(CHECKOUT_STORAGE, null);
  rotateIdempotencyKey();
}
