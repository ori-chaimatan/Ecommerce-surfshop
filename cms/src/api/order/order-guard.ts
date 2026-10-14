import { AsyncLocalStorage } from 'node:async_hooks';
import type { Core } from '@strapi/strapi';
import { errors } from '@strapi/utils';

/**
 * Orders are records of what was sold: only the order store writes them. Admins (and any
 * other document-service caller) may change Status, ShippingAddress and User; every other
 * field is read-only, and orders can't be created or cloned outside checkout.
 *
 * The admin's edit view greys these fields out (bootstrap/order-admin.ts); this guard is the
 * server-side enforcement. An admin save sends the whole form, so an update is only rejected
 * when a locked field's value actually differs from the stored one.
 */

const ORDER_UID = 'api::order.order';

/** In schema order. */
export const LOCKED_FIELDS = [
  'OrderNumber',
  'Email',
  'ShippingMethod',
  'Lines',
  'Subtotal',
  'ShippingCost',
  'Total',
  'Currency',
  'PaymentBrand',
  'PaymentLast4',
  'PaymentReference',
  'IdempotencyKey',
  'PlacedAt',
] as const;

const DECIMALS = new Set(['Subtotal', 'ShippingCost', 'Total']);
const LINE_TEXT = ['ProductDocumentId', 'Name', 'Slug', 'SizeKey', 'SizeLabel', 'ImageUrl', 'ImageAlt'];
const LINE_NUMBERS = ['UnitPrice', 'Quantity', 'LineTotal'];
const CREATE_ACTIONS = new Set(['create', 'clone']);

const storeContext = new AsyncLocalStorage<true>();

/** Runs `work` as the order store: the guard lets its writes through. */
export const asOrderStore = <T>(work: () => Promise<T>) => storeContext.run(true, work);
export const isOrderStore = () => storeContext.getStore() === true;

const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));
const sameNumber = (a: unknown, b: unknown) => Number(a) === Number(b);
const sameDate = (a: unknown, b: unknown) => Date.parse(text(a)) === Date.parse(text(b));

type Line = Record<string, unknown>;

function sameLines(stored: unknown, incoming: unknown) {
  const a = (Array.isArray(stored) ? stored : []) as Line[];
  const b = (Array.isArray(incoming) ? incoming : []) as Line[];
  return (
    a.length === b.length &&
    a.every(
      (line, i) =>
        LINE_TEXT.every((field) => text(line[field]) === text(b[i][field])) &&
        LINE_NUMBERS.every((field) => sameNumber(line[field], b[i][field]))
    )
  );
}

/** Locked fields whose incoming value differs from the stored order (fields left out are unchanged). */
export function lockedChanges(stored: Record<string, unknown>, data: Record<string, unknown>): string[] {
  return LOCKED_FIELDS.filter((field) => {
    if (!(field in data)) return false;
    if (field === 'Lines') return !sameLines(stored.Lines, data.Lines);
    if (field === 'PlacedAt') return !sameDate(stored.PlacedAt, data.PlacedAt);
    if (DECIMALS.has(field)) return !sameNumber(stored[field], data[field]);
    return text(stored[field]) !== text(data[field]);
  });
}

type DocumentContext = { uid: string; action: string; params: { documentId?: string; data?: Record<string, unknown> } };

export function createOrderGuard(strapi: Core.Strapi) {
  return async (context: DocumentContext, next: () => Promise<unknown>) => {
    if (context.uid !== ORDER_UID || isOrderStore()) return next();

    if (CREATE_ACTIONS.has(context.action)) {
      throw new errors.ValidationError('Orders are created at checkout only.');
    }

    const data = context.params.data;
    if (context.action === 'update' && data && LOCKED_FIELDS.some((field) => field in data)) {
      const stored = await strapi.db
        .query(ORDER_UID as never)
        .findOne({ where: { documentId: context.params.documentId }, populate: { Lines: true } });
      const changed = stored ? lockedChanges(stored as Record<string, unknown>, data) : [];
      if (changed.length > 0) {
        throw new errors.ValidationError(`These order fields are read-only: ${changed.join(', ')}.`);
      }
    }

    return next();
  };
}

export function registerOrderGuard(strapi: Core.Strapi) {
  strapi.documents.use(createOrderGuard(strapi) as never);
}
